// A lightweight single-match simulation so a soccer MyTeam squad can play for
// wins that feed the leaderboard. Low-scoring soccer scorelines.
function gauss(mean = 0, sd = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const OPPONENTS = [
  "Madrid", "Munich", "Manchester", "Paris", "Milan", "Liverpool", "Turin",
  "Amsterdam", "Lisbon", "Dortmund", "Naples", "Seville", "London", "Marseille",
  "Porto", "Glasgow", "Buenos Aires", "São Paulo", "Montevideo",
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

  const total = Math.max(0, Math.round(Math.abs(gauss(2.4, 1.4))));
  const margin = Math.max(1, Math.min(total + 1, 1 + Math.round(Math.abs(diff) * 0.1 + Math.abs(gauss(0, 1)))));
  const loser = Math.max(0, Math.round((total - margin) / 2));
  const winner = loser + margin;

  return {
    win,
    teamScore: win ? winner : loser,
    oppScore: win ? loser : winner,
    opponent: OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)],
  };
}
