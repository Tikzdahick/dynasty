// MyTeam — lineup model + combined team rating. Mirrors the NBA sim's rating
// blend (starters weighted heavily, a small bench contribution, and a bonus for
// a positionally complete starting five) so a MyTeam squad reads consistently
// with the rest of Dynasty.
import { NbaPosition } from "@/types";
import { Card } from "@/lib/myteam/cards";

export const STARTER_SLOTS: NbaPosition[] = ["PG", "SG", "SF", "PF", "C"];
export const BENCH_SIZE = 3;

export interface Lineup {
  starters: (string | null)[]; // length 5, aligned to STARTER_SLOTS
  bench: (string | null)[]; // length BENCH_SIZE, any position
}

export function emptyLineup(): Lineup {
  return {
    starters: Array(STARTER_SLOTS.length).fill(null),
    bench: Array(BENCH_SIZE).fill(null),
  };
}

/** Normalise a possibly-stale stored lineup to the current slot shape. */
export function normalizeLineup(l: Partial<Lineup> | null | undefined): Lineup {
  const base = emptyLineup();
  if (!l) return base;
  for (let i = 0; i < base.starters.length; i++)
    base.starters[i] = l.starters?.[i] ?? null;
  for (let i = 0; i < base.bench.length; i++) base.bench[i] = l.bench?.[i] ?? null;
  return base;
}

/** Combined overall (0–99). Starters 80% / bench 20%, +balance for a full five. */
export function teamOverall(starters: Card[], bench: Card[]): number {
  if (starters.length === 0 && bench.length === 0) return 0;
  const sAvg = starters.length
    ? starters.reduce((a, c) => a + c.overall, 0) / starters.length
    : 0;
  const bAvg = bench.length
    ? bench.reduce((a, c) => a + c.overall, 0) / bench.length
    : Math.max(0, sAvg - 6);
  const positions = new Set(starters.map((c) => c.position));
  const balance = positions.size >= 5 ? 1.5 : positions.size >= 4 ? 0.75 : 0;
  const base = starters.length ? sAvg * 0.8 + bAvg * 0.2 + balance : bAvg;
  return Math.round(base);
}
