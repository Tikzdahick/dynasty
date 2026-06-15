import { Formation, FormationName, SoccerPosition } from "@/types";

// y: 8 = own box (GK), 92 = opponent box. x: 10..90 across the pitch.
export const FORMATIONS: Record<FormationName, Formation> = {
  "4-3-3": {
    name: "4-3-3",
    slots: [
      { position: "GK", x: 50, y: 8 },
      { position: "DEF", x: 18, y: 28 },
      { position: "DEF", x: 39, y: 24 },
      { position: "DEF", x: 61, y: 24 },
      { position: "DEF", x: 82, y: 28 },
      { position: "MID", x: 30, y: 52 },
      { position: "MID", x: 50, y: 48 },
      { position: "MID", x: 70, y: 52 },
      { position: "FWD", x: 22, y: 78 },
      { position: "FWD", x: 50, y: 84 },
      { position: "FWD", x: 78, y: 78 },
    ],
  },
  "4-4-2": {
    name: "4-4-2",
    slots: [
      { position: "GK", x: 50, y: 8 },
      { position: "DEF", x: 18, y: 28 },
      { position: "DEF", x: 39, y: 24 },
      { position: "DEF", x: 61, y: 24 },
      { position: "DEF", x: 82, y: 28 },
      { position: "MID", x: 18, y: 54 },
      { position: "MID", x: 39, y: 50 },
      { position: "MID", x: 61, y: 50 },
      { position: "MID", x: 82, y: 54 },
      { position: "FWD", x: 38, y: 82 },
      { position: "FWD", x: 62, y: 82 },
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    slots: [
      { position: "GK", x: 50, y: 8 },
      { position: "DEF", x: 28, y: 26 },
      { position: "DEF", x: 50, y: 22 },
      { position: "DEF", x: 72, y: 26 },
      { position: "MID", x: 14, y: 52 },
      { position: "MID", x: 34, y: 48 },
      { position: "MID", x: 50, y: 44 },
      { position: "MID", x: 66, y: 48 },
      { position: "MID", x: 86, y: 52 },
      { position: "FWD", x: 38, y: 82 },
      { position: "FWD", x: 62, y: 82 },
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    slots: [
      { position: "GK", x: 50, y: 8 },
      { position: "DEF", x: 18, y: 28 },
      { position: "DEF", x: 39, y: 24 },
      { position: "DEF", x: 61, y: 24 },
      { position: "DEF", x: 82, y: 28 },
      { position: "MID", x: 38, y: 44 },
      { position: "MID", x: 62, y: 44 },
      { position: "MID", x: 22, y: 66 },
      { position: "MID", x: 50, y: 64 },
      { position: "MID", x: 78, y: 66 },
      { position: "FWD", x: 50, y: 86 },
    ],
  },
};

export function formationCounts(name: FormationName): Record<SoccerPosition, number> {
  const counts: Record<SoccerPosition, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const slot of FORMATIONS[name].slots) counts[slot.position]++;
  return counts;
}

export const SUB_REQUIREMENTS = 3; // any-position subs
