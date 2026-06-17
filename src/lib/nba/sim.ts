import { NbaPlayer, NbaGameResult, NbaSeasonResult } from "@/types";

// Box-Muller for gaussian noise
function gauss(mean = 0, sd = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function teamRating(starters: NbaPlayer[], bench: NbaPlayer[]): number {
  if (starters.length === 0) return 0;
  const sAvg = starters.reduce((a, p) => a + p.overall, 0) / starters.length;
  const bAvg = bench.length ? bench.reduce((a, p) => a + p.overall, 0) / bench.length : sAvg - 6;
  // chemistry bonus for positional balance among starters
  const positions = new Set(starters.map((p) => p.position));
  const balance = positions.size >= 5 ? 1.5 : positions.size >= 4 ? 0.75 : 0;
  return Math.round((sAvg * 0.78 + bAvg * 0.22 + balance) * 10) / 10;
}

const OPPONENTS = [
  "Phoenix", "Boston", "Denver", "Milwaukee", "Miami", "Dallas", "Golden State",
  "Philadelphia", "LA Lakers", "LA Clippers", "Memphis", "Sacramento", "New York",
  "Cleveland", "Atlanta", "Toronto", "Chicago", "New Orleans", "Minnesota",
  "Oklahoma City", "Indiana", "Brooklyn", "Orlando", "Houston", "Utah", "Portland",
  "San Antonio", "Charlotte", "Washington", "Detroit",
];

const UPSET_STORIES = [
  "Went ice cold from three — 4/26 from deep.",
  "21 turnovers handed it away.",
  "Star fouled out with 6 minutes left.",
  "Blew a 17-point lead in the fourth.",
  "Couldn't buy a free throw — 11/24 from the line.",
  "Ran out of legs on the second night of a back-to-back.",
  "Beaten at the buzzer on a contested three.",
  "Outscored 38-19 in a nightmare third quarter.",
];

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function simulateSeason(rating: number, chem = 0): NbaSeasonResult {
  const games: NbaGameResult[] = [];
  let wins = 0;
  let losses = 0;
  // chemistry nudges effective quality (and therefore win probability)
  const eff = rating + chem * 0.25;

  for (let i = 0; i < 82; i++) {
    const oppRating = 78 + gauss(7, 6);
    const homeEdge = i % 2 === 0 ? 2.0 : -1.0;
    const diff = eff - oppRating + homeEdge;

    // logistic win probability, floored so even an all-time team can be upset
    // (~0.8% per game ≈ roughly one loss across a full season at the very top)
    const wp = clamp(1 / (1 + Math.exp(-diff / 6)), 0.05, 0.992);
    const win = Math.random() < wp;

    let margin = clamp(Math.round(Math.abs(diff) * 0.45 + Math.abs(gauss(0, 7))), 1, 32);
    let upset = false;
    let story: string | undefined;
    // a loss when heavily favored is a true upset: keep it close, give it a story
    if (!win && wp >= 0.85) {
      upset = true;
      margin = 1 + Math.floor(Math.random() * 4);
      story = UPSET_STORIES[Math.floor(Math.random() * UPSET_STORIES.length)];
    }

    const total = 208 + Math.round(gauss(0, 9));
    const loser = Math.max(80, Math.round(total / 2 - margin / 2));
    const winner = loser + margin;

    if (win) wins++;
    else losses++;

    games.push({
      game: i + 1,
      opponent: OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)],
      teamScore: win ? winner : loser,
      oppScore: win ? loser : winner,
      win,
      upset,
      story,
    });
  }

  return { wins, losses, games, teamRating: rating };
}
