// Persists win/loss adjustments applied to rival GMs after Rivals matches, so a
// challenged opponent's record actually moves on the leaderboard.
//
// NOTE: simulated/local. For real cross-user rivals, write match results to a
// Supabase `matches` table and update both users' rows server-side; the public
// API here (getRivalDeltas / applyRivalResult) stays the same.
const KEY = "dynasty.rivals.records";

export interface RivalDelta {
  wins: number;
  losses: number;
}

export function getRivalDeltas(): Record<string, RivalDelta> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, RivalDelta>;
  } catch {
    return {};
  }
}

/** Record the outcome of a match for a rival (from the rival's perspective). */
export function applyRivalResult(username: string, rivalWon: boolean): void {
  if (typeof window === "undefined") return;
  const all = getRivalDeltas();
  const cur = all[username] ?? { wins: 0, losses: 0 };
  all[username] = {
    wins: cur.wins + (rivalWon ? 1 : 0),
    losses: cur.losses + (rivalWon ? 0 : 1),
  };
  localStorage.setItem(KEY, JSON.stringify(all));
}
