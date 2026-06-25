// Wordle-style shareable result text. Builds a compact, emoji-grid summary you
// can paste anywhere — the daily-challenge loop's payoff.
import { NbaSeasonResult, SoccerTournamentResult } from "@/types";
import { Identity } from "@/lib/identity";

const SITE = "dynasty";

function dayLabel(): string {
  // YYYY-MM-DD in local time, used to tag daily-challenge shares
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Split the 82-game season into N blocks; a block is 🟩 if flawless, 🟨 if it
 *  had one loss, 🟥 if it had multiple. Recognisable at a glance, spoiler-light. */
function nbaGrid(season: NbaSeasonResult, blocks = 10): string {
  const games = season.games;
  const per = Math.ceil(games.length / blocks);
  const out: string[] = [];
  for (let i = 0; i < games.length; i += per) {
    const chunk = games.slice(i, i + per);
    const losses = chunk.filter((g) => !g.win).length;
    out.push(losses === 0 ? "🟩" : losses === 1 ? "🟨" : "🟥");
  }
  return out.join("");
}

/** One square per match: 🟩 win · 🟨 draw/penalty-win · 🟥 loss. */
function soccerGrid(result: SoccerTournamentResult): string {
  return result.matches
    .map((m) => {
      if (m.win) return m.penalties ? "🟨" : "🟩";
      if (m.draw) return "🟨";
      return "🟥";
    })
    .join("");
}

export function nbaShareText(opts: {
  season: NbaSeasonResult;
  grade: string;
  identity: Identity;
  mode: string;
  daily: boolean;
  streak?: number;
}): string {
  const { season, grade, identity, mode, daily, streak } = opts;
  const header = daily ? `DYNASTY 🏀 Daily · ${dayLabel()}` : `DYNASTY 🏀 ${mode}`;
  const lines = [
    header,
    `${season.wins}-${season.losses} · ${grade} · ${identity.emoji} ${identity.name}`,
    nbaGrid(season),
  ];
  if (streak && streak > 1) lines.push(`🔥 ${streak}-day streak`);
  lines.push(SITE);
  return lines.join("\n");
}

export function soccerShareText(opts: {
  result: SoccerTournamentResult;
  formation: string;
  identity: Identity;
  mode: string;
  daily: boolean;
  streak?: number;
}): string {
  const { result, formation, identity, mode, daily, streak } = opts;
  const header = daily ? `DYNASTY ⚽ Daily · ${dayLabel()}` : `DYNASTY ⚽ ${mode}`;
  const crown = result.champion ? "🏆 Champion" : `Out: ${result.reachedRound}`;
  const lines = [
    header,
    `${crown} · ${formation} · ${identity.emoji} ${identity.name}`,
    soccerGrid(result),
  ];
  if (streak && streak > 1) lines.push(`🔥 ${streak}-day streak`);
  lines.push(SITE);
  return lines.join("\n");
}
