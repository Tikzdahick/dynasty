// Soccer log of every pack/reward opening and the cards it produced.
const KEY = "dynasty.sc.packhistory";
const MAX = 300;

export interface PackHistoryEntry {
  id: string;
  ts: number;
  source: string; // "Pro Pack", "Starter Pack", "Daily Reward", etc.
  cardIds: string[];
}

export function getPackHistory(): PackHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as PackHistoryEntry[];
  } catch {
    return [];
  }
}

export function logPackOpen(source: string, cardIds: string[]) {
  if (typeof window === "undefined" || cardIds.length === 0) return;
  const all = getPackHistory();
  all.unshift({
    id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    source,
    cardIds,
  });
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX)));
}
