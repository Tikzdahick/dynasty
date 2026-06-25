// Rivals — competitive matchmaking against bot GMs near the user's team rating,
// each with a viewable roster, plus a head-to-head match simulation.
import { mulberry32, seedFromString } from "@/lib/rng";
import { Card, CARD_POOL } from "@/lib/myteam/cards";
import { NbaPosition } from "@/types";
import { botRivals, RivalBase } from "@/lib/myteam/leaderboard";
import { RivalDelta } from "@/lib/store/rivals";

const STARTER_POSITIONS: NbaPosition[] = ["PG", "SG", "SF", "PF", "C"];

export interface RivalProfile extends RivalBase {
  roster: Card[]; // starting five
  diff: number; // OVR distance from the user (set during matchmaking)
}

/** Build a believable starting five for a rival, centred on their team OVR. */
export function rivalRoster(username: string, teamOvr: number): Card[] {
  const rng = mulberry32(seedFromString(`dynasty:rival:${username}`));
  const used = new Set<string>();
  const roster: Card[] = [];

  for (const pos of STARTER_POSITIONS) {
    const byPos = CARD_POOL.filter(
      (c) => c.position === pos && !c.moment && !used.has(c.id)
    );
    // widen the rating band until we find candidates
    let pool: Card[] = [];
    for (const band of [3, 6, 10, 99]) {
      pool = byPos.filter((c) => Math.abs(c.overall - teamOvr) <= band);
      if (pool.length) break;
    }
    if (!pool.length) pool = byPos;
    if (!pool.length) continue;
    const pickCard = pool[Math.floor(rng() * pool.length)];
    used.add(pickCard.id);
    roster.push(pickCard);
  }
  return roster;
}

/** Rivals near the user's rating, closest first. */
export function findRivals(
  userOvr: number,
  deltas: Record<string, RivalDelta> = {},
  count = 6
): RivalProfile[] {
  return botRivals()
    .map((b) => {
      const d = deltas[b.username];
      return {
        ...b,
        wins: b.wins + (d?.wins ?? 0),
        losses: b.losses + (d?.losses ?? 0),
        diff: Math.abs(b.teamOvr - userOvr),
        roster: rivalRoster(b.username, b.teamOvr),
      };
    })
    .sort((a, b) => a.diff - b.diff)
    .slice(0, count);
}

function gauss(mean = 0, sd = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface HeadToHead {
  userWon: boolean;
  userScore: number;
  rivalScore: number;
}

/** Head-to-head game: closer ratings → coin-flip; gaps tilt the odds. */
export function simulateHeadToHead(userOvr: number, rivalOvr: number): HeadToHead {
  const diff = userOvr - rivalOvr + gauss(0, 1.5);
  const wp = Math.max(0.05, Math.min(0.95, 1 / (1 + Math.exp(-diff / 6))));
  const userWon = Math.random() < wp;

  const margin = Math.max(1, Math.round(Math.abs(diff) * 0.5 + Math.abs(gauss(0, 6))));
  const total = 210 + Math.round(gauss(0, 8));
  const loser = Math.max(84, Math.round(total / 2 - margin / 2));
  const winner = loser + margin;

  return {
    userWon,
    userScore: userWon ? winner : loser,
    rivalScore: userWon ? loser : winner,
  };
}
