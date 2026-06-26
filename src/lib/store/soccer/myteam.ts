// Soccer MyTeam persistence — Dynasty Coins balance and the owned-card
// collection, namespaced separately from the NBA MyTeam economy. Local-first.
import { Lineup, emptyLineup, normalizeLineup } from "@/lib/soccer-myteam/lineup";

const COINS_KEY = "dynasty.sc.myteam.coins";
const OWNED_KEY = "dynasty.sc.myteam.owned";
const INIT_KEY = "dynasty.sc.myteam.init";
const LINEUP_KEY = "dynasty.sc.myteam.lineup";
const ONBOARD_KEY = "dynasty.sc.myteam.onboarded";
const TEAM_KEY = "dynasty.sc.myteam.favteam";

export const STARTING_COINS = 2500;

export interface OwnedCard {
  iid: string; // unique instance id (duplicates are distinct, for selling/auctions)
  cardId: string;
  acquiredAt: number;
}

function makeIid(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Grant the starting balance once per device. Safe to call on every mount. */
export function ensureInit(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(INIT_KEY)) return;
  localStorage.setItem(INIT_KEY, "1");
  localStorage.setItem(COINS_KEY, String(STARTING_COINS));
}

export function getCoins(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(COINS_KEY);
  return raw == null ? 0 : Math.max(0, parseInt(raw, 10) || 0);
}

export function setCoins(n: number): number {
  if (typeof window === "undefined") return 0;
  const v = Math.max(0, Math.round(n));
  localStorage.setItem(COINS_KEY, String(v));
  return v;
}

export function addCoins(delta: number): number {
  return setCoins(getCoins() + delta);
}

/** Spend coins if affordable. Returns the new balance, or null if too poor. */
export function spendCoins(amount: number): number | null {
  const bal = getCoins();
  if (bal < amount) return null;
  return setCoins(bal - amount);
}

export function getOwned(): OwnedCard[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(OWNED_KEY) || "[]") as OwnedCard[];
  } catch {
    return [];
  }
}

function writeOwned(list: OwnedCard[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(OWNED_KEY, JSON.stringify(list));
}

/** Add one instance per card id (duplicates allowed). Returns the new entries. */
export function addOwned(cardIds: string[]): OwnedCard[] {
  const fresh = cardIds.map((cardId) => ({
    iid: makeIid(),
    cardId,
    acquiredAt: Date.now(),
  }));
  writeOwned([...getOwned(), ...fresh]);
  return fresh;
}

/** Remove a single owned instance (e.g. quick-sell). Returns true if removed. */
export function removeOwned(iid: string): boolean {
  const list = getOwned();
  const next = list.filter((o) => o.iid !== iid);
  if (next.length === list.length) return false;
  writeOwned(next);
  return true;
}

export function ownedCount(): number {
  return getOwned().length;
}

/* ---------------- lineup ---------------- */
export function getLineup(): Lineup {
  if (typeof window === "undefined") return emptyLineup();
  try {
    const raw = localStorage.getItem(LINEUP_KEY);
    return raw ? normalizeLineup(JSON.parse(raw) as Lineup) : emptyLineup();
  } catch {
    return emptyLineup();
  }
}

export function setLineup(lineup: Lineup): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LINEUP_KEY, JSON.stringify(lineup));
}

/* ---------------- onboarding ---------------- */
export function isOnboarded(): boolean {
  if (typeof window === "undefined") return true; // never block SSR/first paint
  return localStorage.getItem(ONBOARD_KEY) === "1";
}

export function markOnboarded(favTeamId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARD_KEY, "1");
  localStorage.setItem(TEAM_KEY, favTeamId);
}

export function getFavTeam(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TEAM_KEY);
}
