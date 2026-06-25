// Local persistence for the daily-challenge streak and unlocked achievements.
// Guest-friendly: lives entirely in localStorage.
const STREAK_KEY = "dynasty.streak";
const ACH_KEY = "dynasty.achievements";

export interface StreakState {
  count: number;
  best: number;
  lastDay: string; // YYYY-MM-DD
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function isYesterday(day: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return day === y;
}

export function getStreak(): StreakState {
  if (typeof window === "undefined") return { count: 0, best: 0, lastDay: "" };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw) as StreakState;
  } catch {
    /* ignore */
  }
  return { count: 0, best: 0, lastDay: "" };
}

/** Returns the live count for display even when no daily was completed today. */
export function currentStreak(): number {
  const s = getStreak();
  if (!s.lastDay) return 0;
  if (s.lastDay === today() || isYesterday(s.lastDay)) return s.count;
  return 0; // streak has lapsed
}

/** Record that a daily challenge was completed today. Idempotent per day. */
export function recordDailyPlay(): StreakState {
  if (typeof window === "undefined") return { count: 0, best: 0, lastDay: "" };
  const s = getStreak();
  const t = today();
  if (s.lastDay === t) return s; // already counted today
  let count: number;
  if (isYesterday(s.lastDay)) count = s.count + 1;
  else count = 1; // gap (or first ever) → reset to 1
  const next: StreakState = { count, best: Math.max(count, s.best), lastDay: t };
  localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  return next;
}

export function getUnlocked(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ACH_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

/** Persist the given ids and return only the ones newly unlocked this call. */
export function unlock(ids: string[]): string[] {
  if (typeof window === "undefined") return [];
  const have = new Set(getUnlocked());
  const fresh = ids.filter((id) => !have.has(id));
  if (fresh.length) {
    for (const id of fresh) have.add(id);
    localStorage.setItem(ACH_KEY, JSON.stringify([...have]));
  }
  return fresh;
}
