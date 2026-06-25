// A lightweight single-game simulation so a MyTeam squad can play for wins that
// feed the leaderboard. Same Gaussian/logistic shape as the season engine.
function gauss(mean = 0, sd = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const OPPONENTS = [
  "Phoenix", "Boston", "Denver", "Milwaukee", "Miami", "Dallas", "Golden State",
  "Philadelphia", "LA Lakers", "Memphis", "New York", "Cleveland", "Atlanta",
  "Chicago", "Minnesota", "Oklahoma City", "Indiana", "Houston", "Sacramento",
];

export interface ExhibitionResult {
  win: boolean;
  teamScore: number;
  oppScore: number;
  opponent: string;
}

export function simulateExhibition(teamOvr: number): ExhibitionResult {
  const oppRating = 78 + gauss(2, 6);
  const diff = teamOvr - oppRating + 2; // small home edge
  const wp = Math.max(0.04, Math.min(0.97, 1 / (1 + Math.exp(-diff / 6))));
  const win = Math.random() < wp;

  const margin = Math.max(1, Math.round(Math.abs(diff) * 0.4 + Math.abs(gauss(0, 7))));
  const total = 210 + Math.round(gauss(0, 9));
  const loser = Math.max(82, Math.round(total / 2 - margin / 2));
  const winner = loser + margin;

  return {
    win,
    teamScore: win ? winner : loser,
    oppScore: win ? loser : winner,
    opponent: OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)],
  };
}
