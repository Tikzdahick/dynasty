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

/** First-login setup: seed the server-owned starting balance and reset the local
 *  cache. Nothing is imported from the guest's localStorage — coins come from
 *  grant_starting_coins, and cards come from the server-granted starter pack the
 *  onboarding flow requests. This keeps a new account fully server-authoritative
 *  (a guest can't carry up an edited coin count or collection). */
async function migrate(): Promise<void> {
  const sb = getSupabase();
  if (!sb || typeof window === "undefined") return;
  const uid = await resolveUid(sb);
  if (!uid) return;

  for (const sport of ["nba", "soccer"] as Sport[]) {
    const k = KEYS[sport];
    // server-owned starting balance (one-time; no-op if the wallet exists)
    const { data: startBal } = await sb.rpc("grant_starting_coins", { p_sport: sport });
    localStorage.setItem(k.coins, String(typeof startBal === "number" ? startBal : 0));
    // no server cards/squads yet → clear any local guest state so the cache
    // matches the empty server side (the starter pack is granted at onboarding)
    localStorage.setItem(k.owned, "[]");
    localStorage.removeItem(k.lineup);
    localStorage.setItem(k.init, "1"); // don't re-grant starting coins locally
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

/** A lightweight, non-identifying browser fingerprint for duplicate-account
 *  flagging (userAgent + screen + timezone + language, hashed). Not robust — a
 *  coarse signal only, per the "basic flagging" scope. */
function fingerprint(): string {
  if (typeof navigator === "undefined") return "";
  try {
    const parts = [
      navigator.userAgent,
      typeof screen !== "undefined" ? `${screen.width}x${screen.height}x${screen.colorDepth}` : "",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
    ];
    const s = parts.join("|");
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  } catch {
    return "";
  }
}

/** Report this device's IP (server-read) + fingerprint once, for duplicate-account
 *  flagging. Best-effort and deduped per device via a localStorage flag; the
 *  server also dedupes per user, so calling it on any login is safe. */
export async function logSignup(): Promise<void> {
  if (typeof window === "undefined") return;
  const FLAG = "dynasty.signuplogged";
  if (localStorage.getItem(FLAG)) return;
  const sb = getSupabase();
  if (!sb) return;
  const {
    data: { session },
  } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) return;
  localStorage.setItem(FLAG, "1"); // set first so we don't double-fire
  try {
    await fetch("/api/signup-log", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ fingerprint: fingerprint() }),
    });
  } catch {
    /* best effort — never block the user */
  }
}

/** Call the server-authoritative card-grant route (/api/grant). The server
 *  picks the cards and couples the grant to its cost/claim; the client only
 *  displays the result. Returns { cardIds, balance? } or { error }. */
export async function grantRequest(
  body: Record<string, unknown>
): Promise<{ cardIds?: string[]; balance?: number; price?: number; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: "offline" };
  const {
    data: { session },
  } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) return { error: "not signed in" };
  try {
    const res = await fetch("/api/grant", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return { error: json?.error ?? "grant failed" };
    return json;
  } catch (e: any) {
    return { error: e?.message ?? "network error" };
  }
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
