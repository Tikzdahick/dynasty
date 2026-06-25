import { Decade, DECADES, IconicTeam, NbaPlayer, SoccerPlayer } from "@/types";
import { NBA_ICONIC } from "@/lib/nba/teams";
import { SOCCER_ICONIC } from "@/lib/soccer/teams";
import { nbaEligible, nbaRoles } from "@/lib/nba/eligibility";
import { soccerEligible, soccerRoles } from "@/lib/soccer/eligibility";
import { validateDeck, reportDataErrors } from "./validate";

export interface StatBar {
  label: string;
  value: number; // 0-100 for bar width
}

export interface Deck<P> {
  teams: string[];
  iconicTeamsIn: (decade: Decade) => string[];
  spin: (rng: () => number) => { decade: Decade; team: string; label: string };
  candidates: (
    decade: Decade,
    team: string,
    exclude: Set<string>,
    openPositions: Set<string> | null
  ) => P[];
  eligible: (p: P) => string[];
  roles: (p: P) => string[];
  statBars: (p: P) => StatBar[];
  labelFor: (decade: Decade, team: string) => string;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function makeDeck<P extends { id: string; overall: number }>(
  iconic: IconicTeam<P>[],
  eligible: (p: P) => string[],
  roles: (p: P) => string[],
  statBars: (p: P) => StatBar[]
): Deck<P> {
  // Only teams with a real, verified roster are spinnable / selectable.
  const teams = [...new Set(iconic.map((t) => t.team))];
  const decadesWithTeams = DECADES.filter((d) =>
    iconic.some((t) => t.decade === d)
  );

  const iconicTeamsIn = (decade: Decade) =>
    iconic.filter((t) => t.decade === decade).map((t) => t.team);

  const labelFor = (decade: Decade, team: string) =>
    iconic.find((t) => t.decade === decade && t.team === team)?.label ??
    `${decade} ${team}`;

  const spin = (rng: () => number) => {
    const decade =
      decadesWithTeams[Math.floor(rng() * decadesWithTeams.length)];
    const inDecade = iconicTeamsIn(decade);
    const team = inDecade[Math.floor(rng() * inDecade.length)];
    return { decade, team, label: labelFor(decade, team) };
  };

  // STRICT player–team rule: only ever surface players who actually played
  // for this exact team in this exact decade. Never pad from a broader pool —
  // that's what used to put Jordan/Hakeem/Malone/Barkley on the "1990s Lakers".
  const candidates = (
    decade: Decade,
    team: string,
    exclude: Set<string>,
    openPositions: Set<string> | null
  ): P[] => {
    const t = iconic.find((x) => x.decade === decade && x.team === team);
    if (!t) return [];
    const ok = (p: P) =>
      !exclude.has(p.id) &&
      (!openPositions || eligible(p).some((pos) => openPositions.has(pos)));
    return [...t.players]
      .sort((a, b) => b.overall - a.overall)
      .filter(ok)
      .slice(0, 4);
  };

  return { teams, iconicTeamsIn, spin, candidates, eligible, roles, statBars, labelFor };
}

export const nbaDeck: Deck<NbaPlayer> = makeDeck(
  NBA_ICONIC,
  nbaEligible,
  nbaRoles,
  (p) => [
    { label: "SCO", value: clamp((p.ppg / 30) * 100) },
    { label: "REB", value: clamp((p.rpg / 15) * 100) },
    { label: "PLY", value: clamp((p.apg / 11) * 100) },
    { label: "OVR", value: p.overall },
  ]
);

export const soccerDeck: Deck<SoccerPlayer> = makeDeck(
  SOCCER_ICONIC,
  soccerEligible,
  soccerRoles,
  (p) => [
    { label: "PAC", value: p.pace },
    { label: "SHO", value: p.shooting },
    { label: "PAS", value: p.passing },
    { label: "DEF", value: p.defending },
  ]
);

// Hard data-integrity gate: enforces the strict player–team rules at build
// time. If any roster ever violates them, `next build` fails loudly.
const NBA_POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
const SOCCER_POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;

reportDataErrors([
  ...validateDeck({
    label: "NBA",
    iconic: NBA_ICONIC,
    validPositions: NBA_POSITIONS,
    eligible: nbaEligible,
    candidates: nbaDeck.candidates,
  }),
  ...validateDeck({
    label: "Soccer",
    iconic: SOCCER_ICONIC,
    validPositions: SOCCER_POSITIONS,
    eligible: soccerEligible,
    candidates: soccerDeck.candidates,
  }),
]);
