// Server-authoritative card grants. The server (not the client) picks which
// cards are granted — it owns the pool + odds — and couples the grant to its
// cost / claim atomically in the DB. This is the only path that may add cards to
// owned_cards once the client's direct INSERT is revoked.
//
// Body: { type, sport, ... }
//   pack   : { packId }            -> deduct price + open pack + grant
//   starter: { teamId }            -> one-time free starter pack
//   reward : { source, ref, period}-> daily 3/7 / weekly / season card reward
//   moment : { cardId }            -> priced buy of one specific card
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { serviceClient, userIdFromRequest } from "@/lib/supabase/service";

import { openPack as nbaOpen, packById as nbaPackById, drawAtLeast as nbaDraw } from "@/lib/myteam/packs";
import { starterPackForTeam as nbaStarter, cardById as nbaCardById, Rarity } from "@/lib/myteam/cards";
import { momentPrice as nbaMomentPrice } from "@/lib/myteam/moments";
import { openPack as scOpen, packById as scPackById, drawAtLeast as scDraw } from "@/lib/soccer-myteam/packs";
import { starterPackForTeam as scStarter, cardById as scCardById } from "@/lib/soccer-myteam/cards";
import { momentPrice as scMomentPrice } from "@/lib/soccer-myteam/moments";

type Sport = "nba" | "soccer";

// Server-owned specs for card/pack rewards (identical across sports).
type Spec = { kind: "pack"; packId: string } | { kind: "card"; minRarity: Rarity };
const REWARD_SPECS: Record<string, Spec> = {
  "daily:3": { kind: "pack", packId: "pro" },
  "daily:7": { kind: "card", minRarity: "Gold" },
  "challenge:w_win10": { kind: "card", minRarity: "Gold" },
  "challenge:w_rivals5": { kind: "card", minRarity: "Gold" },
  "challenge:w_packs5": { kind: "pack", packId: "elite" },
  "season:2": { kind: "pack", packId: "pro" },
  "season:4": { kind: "card", minRarity: "Gold" },
  "season:6": { kind: "pack", packId: "elite" },
  "season:8": { kind: "card", minRarity: "Diamond" },
  "season:10": { kind: "pack", packId: "dynasty" },
  "season:12": { kind: "card", minRarity: "Dynasty" },
};

// Loosely typed so the two sports' distinct Card types don't intersect to never.
interface Deps {
  open: (pack: any) => { id: string }[];
  packById: (id: string) => any;
  draw: (minRarity: any) => { id: string };
  starter: (teamId: string) => { id: string }[];
  cardById: (id: string) => any;
  momentPrice: (card: any) => number;
}

function deps(sport: Sport): Deps {
  return sport === "soccer"
    ? { open: scOpen, packById: scPackById, draw: scDraw, starter: scStarter, cardById: scCardById, momentPrice: scMomentPrice }
    : { open: nbaOpen, packById: nbaPackById, draw: nbaDraw, starter: nbaStarter, cardById: nbaCardById, momentPrice: nbaMomentPrice };
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

/** Server-side throttle. Returns true if the action is allowed (and records it),
 *  false if the user is over the limit. Fails open on an RPC error. */
async function rateOk(
  svc: ReturnType<typeof serviceClient>,
  uid: string,
  action: string,
  max: number,
  windowSecs: number
): Promise<boolean> {
  const { data, error } = await svc.rpc("rate_limit", {
    p_user: uid, p_action: action, p_max: max, p_window_secs: windowSecs,
  });
  if (error) return true; // don't block legit users on an infra hiccup
  return data === true;
}

export async function POST(req: Request) {
  const uid = await userIdFromRequest(req);
  if (!uid) return bad("not signed in", 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("invalid body");
  }
  const sport: Sport = body?.sport;
  if (sport !== "nba" && sport !== "soccer") return bad("bad sport");
  const d = deps(sport);
  const svc = serviceClient();

  try {
    switch (body?.type) {
      case "pack": {
        const pack = d.packById(String(body.packId));
        if (!pack) return bad("unknown pack");
        if (!(await rateOk(svc, uid, "pack", 60, 60))) return bad("rate limited: too many packs, slow down", 429);
        const cardIds = d.open(pack).map((c) => c.id);
        const { data, error } = await svc.rpc("srv_open_pack", {
          p_user: uid, p_sport: sport, p_price: pack.price, p_card_ids: cardIds,
        });
        if (error) return bad(error.message);
        return NextResponse.json({ cardIds, balance: data });
      }

      case "starter": {
        const cardIds = d.starter(String(body.teamId ?? "")).map((c) => c.id);
        const { data, error } = await svc.rpc("srv_grant_starter", {
          p_user: uid, p_sport: sport, p_card_ids: cardIds,
        });
        if (error) return bad(error.message);
        // data=false means the starter was already granted → grant nothing
        return NextResponse.json({ cardIds: data ? cardIds : [] });
      }

      case "reward": {
        const source = String(body.source);
        const ref = String(body.ref);
        const period = String(body.period ?? "");
        const spec = REWARD_SPECS[`${source}:${ref}`];
        if (!spec) return bad("unknown reward");
        const cardIds =
          spec.kind === "pack"
            ? d.open(d.packById(spec.packId)!).map((c) => c.id)
            : [d.draw(spec.minRarity).id];
        const { error } = await svc.rpc("srv_grant_reward_cards", {
          p_user: uid, p_sport: sport, p_source: source, p_ref: ref, p_period: period, p_card_ids: cardIds,
        });
        if (error) return bad(error.message);
        return NextResponse.json({ cardIds });
      }

      case "moment": {
        const cardId = String(body.cardId);
        const card = d.cardById(cardId);
        if (!card) return bad("unknown card");
        if (!(await rateOk(svc, uid, "moment", 30, 60))) return bad("rate limited: too many moments, slow down", 429);
        const price = d.momentPrice(card);
        const { data, error } = await svc.rpc("srv_buy_moment", {
          p_user: uid, p_sport: sport, p_price: price, p_card_id: cardId,
        });
        if (error) return bad(error.message);
        return NextResponse.json({ cardIds: [cardId], balance: data, price });
      }

      default:
        return bad("unknown grant type");
    }
  } catch (e: any) {
    return bad(e?.message ?? "grant failed", 500);
  }
}
