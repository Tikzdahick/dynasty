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

export function simulateSeason(rating: number): NbaSeasonResult {
  const games: NbaGameResult[] = [];
  let wins = 0;
  let losses = 0;

  for (let i = 0; i < 82; i++) {
    // league opponents centered around 85, your roster is usually higher
    const oppRating = 78 + gauss(7, 6);
    const homeEdge = i % 2 === 0 ? 2.0 : -1.0;

    // base points scale with quality; diff drives the margin
    const diff = rating - oppRating + homeEdge;
    const teamScore = Math.max(
      82,
      Math.round(104 + (rating - 88) * 0.9 + diff * 0.55 + gauss(0, 8))
    );
    const oppScore = Math.max(
      80,
      Math.round(104 + (oppRating - 84) * 0.9 - diff * 0.45 + gauss(0, 8))
    );

    let t = teamScore;
    let o = oppScore;
    if (t === o) t += Math.random() < 0.5 ? 1 : -1; // no ties, settle in OT
    const win = t > o;
    if (win) wins++;
    else losses++;

    games.push({
      game: i + 1,
      opponent: OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)],
      teamScore: Math.max(t, o === t ? t + 1 : t),
      oppScore: o,
      win,
    });
  }

  return { wins, losses, games, teamRating: rating };
}
