// Soccer MyTeam win/loss record — drives the soccer MyTeam leaderboard ranking.
// Grows as the user plays exhibition games with their built XI.
const KEY = "dynasty.sc.myteam.record";

export interface MyTeamRecord {
  wins: number;
  losses: number;
  streak: number; // current win streak (negative = losing streak)
}

export function getRecord(): MyTeamRecord {
  if (typeof window === "undefined") return { wins: 0, losses: 0, streak: 0 };
  try {
    return JSON.parse(localStorage.getItem(KEY) || "") as MyTeamRecord;
  } catch {
    return { wins: 0, losses: 0, streak: 0 };
  }
}

export function recordResult(win: boolean): MyTeamRecord {
  const r = getRecord();
  const next: MyTeamRecord = {
    wins: r.wins + (win ? 1 : 0),
    losses: r.losses + (win ? 0 : 1),
    streak: win ? Math.max(1, r.streak + 1) : Math.min(-1, r.streak - 1),
  };
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
