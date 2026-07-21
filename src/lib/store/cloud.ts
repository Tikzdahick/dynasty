// Server sync for logged-in users. Keeps the existing synchronous localStorage
// store as the client's working cache, and mirrors it to Supabase:
//   - on login: hydrate() pulls the account's coins/cards/squads into localStorage
//     (or, for a brand-new account, migrate() pushes the current local data up)
//   - on mutations: the store functions call the push* helpers (fire-and-forget);
//     coin changes go through the adjust_coins() RPC (never a raw balance write).
// Guests (not logged in) are untouched — pure localStorage as before.
import { getSupabase } from "@/lib/supabase/client";

export type Sport = "nba" | "soccer";

const KEYS: Record<Sport, { coins: string; owned: string; lineup: string; init: string }> = {
  nba: {
    coins: "dynasty.myteam.coins",
    owned: "dynasty.myteam.owned",
    lineup: "dynasty.myteam.lineup",
    init: "dynasty.myteam.init",
  },
  soccer: {
    coins: "dynasty.sc.myteam.coins",
    owned: "dynasty.sc.myteam.owned",
    lineup: "dynasty.sc.myteam.lineup",
    init: "dynasty.sc.myteam.init",
  },
};

interface OwnedRow {
  iid: string;
  cardId: string;
  acquiredAt: number;
}

// localStorage keys for the daily-login-reward streak, per sport.
const DAILY_KEYS: Record<Sport, string> = {
  nba: "dynasty.dailyreward",
  soccer: "dynasty.sc.dailyreward",
};

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---- cached auth state (store functions are synchronous, so we cache uid) ----
let cachedUid: string | null = null;
let subscribed = false;

function subscribe() {
  if (subscribed) return;
  const sb = getSupabase();
  if (!sb) return;
  subscribed = true;
  sb.auth.getUser().then(({ data }) => {
    cachedUid = data.user?.id ?? null;
  });
  sb.auth.onAuthStateChange((_e, session) => {
    cachedUid = session?.user?.id ?? null;
    if (!cachedUid) hydratedThisSession = false; // reset on logout
  });
}

export function cloudUserId(): string | null {
  subscribe();
  return cachedUid;
}

/** Reliable uid for async flows (awaits the session if the cache isn't warm). */
async function resolveUid(sb: ReturnType<typeof getSupabase>): Promise<string | null> {
  if (cachedUid) return cachedUid;
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  cachedUid = data.user?.id ?? null;
  return cachedUid;
}

// ---- localStorage helpers ----
function lsGetOwned(key: string): OwnedRow[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as OwnedRow[];
  } catch {
    return [];
  }
}
function lsGetLineup(key: string): { formation?: string; starters: any[]; bench: any[] } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { starters: [], bench: [] };
    const l = JSON.parse(raw);
    return { formation: l.formation, starters: l.starters ?? [], bench: l.bench ?? [] };
  } catch {
    return { starters: [], bench: [] };
  }
}

// ---- hydration ----
let hydratedThisSession = false;

/** Pull the account's data into localStorage (once per login session). */
export async function ensureHydrated(): Promise<void> {
  if (hydratedThisSession) return;
  const sb = getSupabase();
  if (!sb || typeof window === "undefined") return;
  const uid = await resolveUid(sb);
  if (!uid) return;
  hydratedThisSession = true;

  const [{ data: bals }, { data: cards }, { data: squads }, { data: daily }] = await Promise.all([
    sb.from("coin_balances").select("sport,balance").eq("user_id", uid),
    sb.from("owned_cards").select("iid,sport,card_id,acquired_at").eq("user_id", uid),
    sb.from("squads").select("sport,formation,starters,bench").eq("user_id", uid),
    sb.from("daily_claims").select("sport,last_claim,streak,best").eq("user_id", uid),
  ]);

  // Brand-new account (no balances yet) → migrate the current local data up.
  if (!bals || bals.length === 0) {
    hydratedThisSession = false; // allow a re-hydrate after migration
    await migrate();
    hydratedThisSession = true;
    return;
  }

  for (const sport of ["nba", "soccer"] as Sport[]) {
    const k = KEYS[sport];
    const bal = bals.find((b: any) => b.sport === sport)?.balance ?? 0;
    localStorage.setItem(k.coins, String(bal));
    const owned: OwnedRow[] = (cards ?? [])
      .filter((c: any) => c.sport === sport)
      .map((c: any) => ({ iid: c.iid, cardId: c.card_id, acquiredAt: new Date(c.acquired_at).getTime() }));
    localStorage.setItem(k.owned, JSON.stringify(owned));
    const sq = (squads ?? []).find((s: any) => s.sport === sport);
    if (sq) {
      localStorage.setItem(
        k.lineup,
        JSON.stringify({ formation: sq.formation, starters: sq.starters, bench: sq.bench })
      );
    }
    // daily-reward streak → keep the local track in sync with the server so
    // the modal shows the right day/streak/claimable state across devices.
    const dc = (daily ?? []).find((d: any) => d.sport === sport);
    if (dc && dc.last_claim) {
      localStorage.setItem(
        DAILY_KEYS[sport],
        JSON.stringify({ lastClaim: dc.last_claim, streak: dc.streak, best: dc.best })
      );
    }
    localStorage.setItem(k.init, "1"); // don't re-grant starting coins
  }
}

/** First-login setup: seed a server-owned starting balance and import the
 *  browser's local cards/squads. Coins are NOT imported — a brand-new account
 *  gets the fixed starting balance from the server (grant_starting_coins), so a
 *  guest's local coin count can't be carried up. */
async function migrate(): Promise<void> {
  const sb = getSupabase();
  if (!sb || typeof window === "undefined") return;
  const uid = await resolveUid(sb);
  if (!uid) return;

  for (const sport of ["nba", "soccer"] as Sport[]) {
    const k = KEYS[sport];
    // server-owned starting balance (one-time; no-op if the wallet exists)
    const { data: startBal } = await sb.rpc("grant_starting_coins", { p_sport: sport });
    if (typeof startBal === "number") localStorage.setItem(k.coins, String(startBal));

    const owned = lsGetOwned(k.owned);
    if (owned.length) {
      await sb.from("owned_cards").insert(
        owned.map((o) => ({
          iid: o.iid,
          user_id: uid,
          sport,
          card_id: o.cardId,
          acquired_at: new Date(o.acquiredAt || Date.now()).toISOString(),
        }))
      );
    }

    const lineup = lsGetLineup(k.lineup);
    await sb.from("squads").upsert({
      user_id: uid,
      sport,
      formation: lineup.formation ?? null,
      starters: lineup.starters,
      bench: lineup.bench,
    });
  }
}

/** Re-pull one sport's coins + cards from the server into the local cache.
 *  Call after a server-side change (e.g. an auction trade) to reconcile. */
export async function resync(sport: Sport): Promise<void> {
  const sb = getSupabase();
  if (!sb || typeof window === "undefined") return;
  const uid = await resolveUid(sb);
  if (!uid) return;
  const k = KEYS[sport];
  const [{ data: balRow }, { data: cards }] = await Promise.all([
    sb.from("coin_balances").select("balance").eq("user_id", uid).eq("sport", sport).maybeSingle(),
    sb.from("owned_cards").select("iid,card_id,acquired_at").eq("user_id", uid).eq("sport", sport),
  ]);
  if (balRow) localStorage.setItem(k.coins, String(balRow.balance));
  localStorage.setItem(
    k.owned,
    JSON.stringify(
      (cards ?? []).map((c: any) => ({ iid: c.iid, cardId: c.card_id, acquiredAt: new Date(c.acquired_at).getTime() }))
    )
  );
}

/** Server-authoritative spend for logged-in users. Deducts via the adjust_coins
 *  RPC (which validates balance >= amount server-side and rejects overspend) and
 *  returns the new balance, or null if the server rejected it. Syncs the local
 *  mirror to the authoritative value. Use this to GATE an action (e.g. a pack)
 *  so the client can never spend coins it doesn't actually have. */
export async function spendServer(sport: Sport, amount: number): Promise<number | null> {
  const sb = getSupabase();
  if (!sb || !cloudUserId()) return null;
  const { data, error } = await sb.rpc("adjust_coins", { p_sport: sport, p_delta: -amount });
  if (error || typeof data !== "number") return null;
  if (typeof window !== "undefined") localStorage.setItem(KEYS[sport].coins, String(data));
  return data;
}

/** Claim a coin reward (challenge / season tier) server-side. The server owns
 *  the amount (reward_defs) and dedups the claim (reward_claims), so a client
 *  can't inflate or replay it. Returns the credited coins, or null if rejected
 *  (already claimed / unknown reward / not logged in). Resyncs the balance. */
export async function claimRewardServer(
  sport: Sport,
  source: string,
  ref: string,
  period = ""
): Promise<number | null> {
  const sb = getSupabase();
  if (!sb || !cloudUserId()) return null;
  const { data, error } = await sb.rpc("claim_reward", {
    p_source: source,
    p_ref: ref,
    p_sport: sport,
    p_period: period,
  });
  if (error || typeof data !== "number") return null;
  await resync(sport); // pull the server-credited balance into the cache
  return data;
}

export interface DailyClaim {
  day: number;
  streak: number;
  coins: number;
}

/** Claim today's daily reward server-side. The server enforces one claim per
 *  calendar day (per sport), computes the streak, and credits the coin days
 *  itself. Returns the claim result, or null if the server rejected it (already
 *  claimed today / not logged in). On success the local streak is synced and,
 *  for coin days, the server-credited balance is pulled back into the cache. */
export async function claimDailyServer(sport: Sport): Promise<DailyClaim | null> {
  const sb = getSupabase();
  if (!sb || !cloudUserId()) return null;
  const { data, error } = await sb.rpc("claim_daily", { p_sport: sport });
  if (error || !data) return null;
  const r = data as DailyClaim;
  if (typeof window !== "undefined") {
    const key = DAILY_KEYS[sport];
    let best = r.streak;
    try {
      const prev = JSON.parse(localStorage.getItem(key) || "{}");
      best = Math.max(best, prev.best || 0);
    } catch {
      /* ignore */
    }
    localStorage.setItem(key, JSON.stringify({ lastClaim: todayLocal(), streak: r.streak, best }));
    if (r.coins > 0) await resync(sport); // pull the server-credited balance
  }
  return r;
}

// ---- write-through (fire-and-forget; guarded on being logged in) ----
export function pushCoin(sport: Sport, delta: number): void {
  const sb = getSupabase();
  if (!sb || !cloudUserId() || delta === 0) return;
  sb.rpc("adjust_coins", { p_sport: sport, p_delta: delta }).then(({ error }) => {
    if (error) console.warn("[cloud] adjust_coins failed:", error.message);
  });
}

export function pushCardAdd(sport: Sport, cards: OwnedRow[]): void {
  const sb = getSupabase();
  const uid = cloudUserId();
  if (!sb || !uid || cards.length === 0) return;
  sb.from("owned_cards")
    .insert(
      cards.map((o) => ({
        iid: o.iid,
        user_id: uid,
        sport,
        card_id: o.cardId,
        acquired_at: new Date(o.acquiredAt || Date.now()).toISOString(),
      }))
    )
    .then(({ error }) => {
      if (error) console.warn("[cloud] card insert failed:", error.message);
    });
}

export function pushCardRemove(iid: string): void {
  const sb = getSupabase();
  if (!sb || !cloudUserId()) return;
  sb.from("owned_cards").delete().eq("iid", iid).then(({ error }) => {
    if (error) console.warn("[cloud] card delete failed:", error.message);
  });
}

export function pushSquad(sport: Sport, lineup: { formation?: string; starters: any[]; bench: any[] }): void {
  const sb = getSupabase();
  const uid = cloudUserId();
  if (!sb || !uid) return;
  sb.from("squads")
    .upsert({
      user_id: uid,
      sport,
      formation: lineup.formation ?? null,
      starters: lineup.starters,
      bench: lineup.bench,
    })
    .then(({ error }) => {
      if (error) console.warn("[cloud] squad upsert failed:", error.message);
    });
}
