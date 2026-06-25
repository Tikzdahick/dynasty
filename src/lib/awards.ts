// Post-sim "awards" / recap — mines the simulated game-by-game data the engines
// already produce to surface a few memorable highlights for the result screen.
import {
  NbaPlayer,
  NbaSeasonResult,
  SoccerPlayer,
  SoccerTournamentResult,
} from "@/types";

export interface Award {
  emoji: string;
  label: string;
  value: string;
  detail?: string;
}

function longestStreak(wins: boolean[]): number {
  let best = 0;
  let cur = 0;
  for (const w of wins) {
    cur = w ? cur + 1 : 0;
    if (cur > best) best = cur;
  }
  return best;
}

export function nbaAwards(season: NbaSeasonResult, roster: NbaPlayer[]): Award[] {
  const awards: Award[] = [];

  // Franchise Player — best overall on the roster (sim has no per-game box score)
  const star = [...roster].sort((a, b) => b.overall - a.overall)[0];
  if (star) {
    awards.push({
      emoji: "⭐",
      label: "Franchise Player",
      value: star.name,
      detail: `${star.ppg} PPG · ${star.overall} OVR`,
    });
  }

  // Signature win — largest margin victory
  const wins = season.games.filter((g) => g.win);
  if (wins.length) {
    const best = wins.reduce((a, g) =>
      g.teamScore - g.oppScore > a.teamScore - a.oppScore ? g : a
    );
    awards.push({
      emoji: "💥",
      label: "Signature Win",
      value: `${best.teamScore}–${best.oppScore}`,
      detail: `+${best.teamScore - best.oppScore} vs ${best.opponent}`,
    });
  }

  // Longest win streak
  const streak = longestStreak(season.games.map((g) => g.win));
  awards.push({
    emoji: "🔥",
    label: "Win Streak",
    value: `${streak}`,
    detail: streak === season.games.length ? "Wire to wire" : "straight",
  });

  return awards;
}

export function soccerAwards(
  result: SoccerTournamentResult,
  xi: SoccerPlayer[]
): Award[] {
  const awards: Award[] = [];

  // Golden Boot — top scorer across the run
  const goals = new Map<string, number>();
  for (const m of result.matches)
    for (const s of m.scorers) goals.set(s.name, (goals.get(s.name) ?? 0) + 1);
  const top = [...goals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] > 0) {
    awards.push({
      emoji: "👟",
      label: "Golden Boot",
      value: top[0],
      detail: `${top[1]} goal${top[1] === 1 ? "" : "s"}`,
    });
  }

  // Clean sheets
  const cleanSheets = result.matches.filter((m) => m.oppGoals === 0).length;
  awards.push({
    emoji: "🧤",
    label: "Clean Sheets",
    value: `${cleanSheets}`,
    detail: `of ${result.matches.length} games`,
  });

  // Biggest win
  const wins = result.matches.filter((m) => m.win && m.teamGoals > m.oppGoals);
  if (wins.length) {
    const best = wins.reduce((a, m) =>
      m.teamGoals - m.oppGoals > a.teamGoals - a.oppGoals ? m : a
    );
    awards.push({
      emoji: "💥",
      label: "Biggest Win",
      value: `${best.teamGoals}–${best.oppGoals}`,
      detail: `${best.round} vs ${best.opponent}`,
    });
  } else {
    // fallback so the panel always shows three cards
    const shootouts = result.matches.filter((m) => m.penalties).length;
    awards.push({
      emoji: "🥅",
      label: "Shootouts",
      value: `${shootouts}`,
      detail: shootouts ? "nerves of steel" : "none needed",
    });
  }

  return awards;
}
