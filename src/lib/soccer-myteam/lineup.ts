// Soccer MyTeam — lineup model + combined team rating. The starting XI is 11
// players arranged by a user-selected formation (4-3-3, 4-4-2, 3-5-2, 4-2-3-1),
// weighted heavily, with a small bench contribution and a bonus for a
// positionally complete XI, so a squad reads consistently with the rest of
// Dynasty.
import { FormationName, SoccerPosition } from "@/types";
import { FORMATIONS } from "@/lib/soccer/formations";
import { Card } from "@/lib/soccer-myteam/cards";

export const FORMATION_NAMES = Object.keys(FORMATIONS) as FormationName[];
export const DEFAULT_FORMATION: FormationName = "4-3-3";

/** The 11 starter slot positions for a formation, aligned to Lineup.starters. */
export function starterSlots(formation: FormationName): SoccerPosition[] {
  return FORMATIONS[formation].slots.map((s) => s.position);
}

// Legacy export: the default 4-3-3 slot shape (kept for any older callers).
export const STARTER_SLOTS: SoccerPosition[] = starterSlots(DEFAULT_FORMATION);
export const BENCH_SIZE = 5;

export interface Lineup {
  formation: FormationName;
  starters: (string | null)[]; // length 11, aligned to starterSlots(formation)
  bench: (string | null)[]; // length BENCH_SIZE, any position
}

export function emptyLineup(): Lineup {
  return {
    formation: DEFAULT_FORMATION,
    starters: Array(STARTER_SLOTS.length).fill(null),
    bench: Array(BENCH_SIZE).fill(null),
  };
}

/** Normalise a possibly-stale stored lineup to the current shape. */
export function normalizeLineup(l: Partial<Lineup> | null | undefined): Lineup {
  const base = emptyLineup();
  if (!l) return base;
  if (l.formation && FORMATIONS[l.formation]) base.formation = l.formation;
  for (let i = 0; i < base.starters.length; i++)
    base.starters[i] = l.starters?.[i] ?? null;
  for (let i = 0; i < base.bench.length; i++) base.bench[i] = l.bench?.[i] ?? null;
  return base;
}

/** Re-slot the current starters into a new formation, preserving as many
 *  players as possible by matching position (extras of a shrunk line drop to
 *  null; newly-added slots of a grown line start empty). `positionOf` resolves a
 *  card id to its position. */
export function reslotStarters(
  starters: (string | null)[],
  fromFormation: FormationName,
  toFormation: FormationName,
  positionOf: (id: string) => SoccerPosition | undefined
): (string | null)[] {
  const fromSlots = starterSlots(fromFormation);
  // bucket the currently-placed ids by their (old) slot position
  const buckets: Record<SoccerPosition, string[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  starters.forEach((id, i) => {
    if (!id) return;
    const pos = positionOf(id) ?? fromSlots[i];
    if (pos) buckets[pos].push(id);
  });
  const toSlots = starterSlots(toFormation);
  return toSlots.map((pos) => buckets[pos].shift() ?? null);
}

/** Combined overall (0–99). Starters 82% / bench 18%, +balance for a full XI. */
export function teamOverall(starters: Card[], bench: Card[]): number {
  if (starters.length === 0 && bench.length === 0) return 0;
  const sAvg = starters.length
    ? starters.reduce((a, c) => a + c.overall, 0) / starters.length
    : 0;
  const bAvg = bench.length
    ? bench.reduce((a, c) => a + c.overall, 0) / bench.length
    : Math.max(0, sAvg - 6);
  const positions = new Set(starters.map((c) => c.position));
  const balance = positions.size >= 4 ? 1.5 : positions.size >= 3 ? 0.75 : 0;
  const base = starters.length ? sAvg * 0.82 + bAvg * 0.18 + balance : bAvg;
  return Math.round(base);
}
