// Daily login-reward streak — distinct from the Daily-Challenge gameplay streak
// in stats.ts. Tracks consecutive days the user has *claimed* a reward.
const KEY = "dynasty.dailyreward";

export const CYCLE_LENGTH = 7;

interface RewardState {
  lastClaim: string; // YYYY-MM-DD, "" if never
  streak: number; // consecutive claim days
  best: number;
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

function read(): RewardState {
  if (typeof window === "undefined") return { lastClaim: "", streak: 0, best: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as RewardState;
  } catch {
    /* ignore */
  }
  return { lastClaim: "", streak: 0, best: 0 };
}

export interface DailyStatus {
  canClaim: boolean;
  streak: number; // streak as it stands right now
  pendingStreak: number; // what the streak becomes if claimed today
  pendingDay: number; // 1..CYCLE_LENGTH — which cycle day today's claim is
}

export function getDailyStatus(): DailyStatus {
  const s = read();
  const canClaim = s.lastClaim !== today();
  // a claim continues the streak only if the last claim was yesterday
  const pendingStreak = canClaim ? (isYesterday(s.lastClaim) ? s.streak + 1 : 1) : s.streak;
  const pendingDay = ((pendingStreak - 1 + CYCLE_LENGTH) % CYCLE_LENGTH) + 1;
  return { canClaim, streak: s.streak, pendingStreak, pendingDay };
}

/** Commit today's claim. Returns the resulting day/streak, or null if already
 *  claimed today (guards against double-granting). */
export function claimDaily(): { day: number; streak: number } | null {
  if (typeof window === "undefined") return null;
  const s = read();
  if (s.lastClaim === today()) return null;
  const streak = isYesterday(s.lastClaim) ? s.streak + 1 : 1;
  const next: RewardState = {
    lastClaim: today(),
    streak,
    best: Math.max(streak, s.best),
  };
  localStorage.setItem(KEY, JSON.stringify(next));
  const day = ((streak - 1) % CYCLE_LENGTH) + 1;
  return { day, streak };
}
