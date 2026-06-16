import { Decade, DECADES, IconicTeam, NbaPlayer, SoccerPlayer } from "@/types";
import {
  NBA_ICONIC,
  NBA_MASTER,
  NBA_FRANCHISES,
  nbaDecadePool,
} from "@/lib/nba/teams";
import {
  SOCCER_ICONIC,
  SOCCER_MASTER,
  SOCCER_TEAMS,
  soccerDecadePool,
} from "@/lib/soccer/teams";
import { nbaEligible, nbaRoles } from "@/lib/nba/eligibility";
import { soccerEligible, soccerRoles } from "@/lib/soccer/eligibility";

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
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function makeDeck<P extends { id: string; overall: number }>(
  iconic: IconicTeam<P>[],
  decadePool: (d: Decade) => P[],
  master: P[],
  teams: string[],
  eligible: (p: P) => string[],
  roles: (p: P) => string[],
  statBars: (p: P) => StatBar[]
): Deck<P> {
  const iconicTeamsIn = (decade: Decade) =>
    iconic.filter((t) => t.decade === decade).map((t) => t.team);

  const labelFor = (decade: Decade, team: string) =>
    iconic.find((t) => t.decade === decade && t.team === team)?.label ??
    `${decade} ${team}`;

  const spin = (rng: () => number) => {
    const decade = DECADES[Math.floor(rng() * DECADES.length)];
    const inDecade = iconicTeamsIn(decade);
    const team =
      inDecade.length && rng() < 0.6
        ? inDecade[Math.floor(rng() * inDecade.length)]
        : teams[Math.floor(rng() * teams.length)];
    return { decade, team, label: labelFor(decade, team) };
  };

  const candidates = (
    decade: Decade,
    team: string,
    exclude: Set<string>,
    openPositions: Set<string> | null
  ): P[] => {
    const ok = (p: P) =>
      !exclude.has(p.id) &&
      (!openPositions || eligible(p).some((pos) => openPositions.has(pos)));
    const byOvr = (arr: P[]) => [...arr].sort((a, b) => b.overall - a.overall);

    const out: P[] = [];
    const seen = new Set<string>();
    const push = (arr: P[]) => {
      for (const p of byOvr(arr)) {
        if (out.length >= 4) break;
        if (seen.has(p.id) || !ok(p)) continue;
        seen.add(p.id);
        out.push(p);
      }
    };

    const t = iconic.find((x) => x.decade === decade && x.team === team);
    if (t) push(t.players);
    if (out.length < 4) push(decadePool(decade));
    if (out.length < 4) push(master);
    return out;
  };

  return { teams, iconicTeamsIn, spin, candidates, eligible, roles, statBars };
}

export const nbaDeck: Deck<NbaPlayer> = makeDeck(
  NBA_ICONIC,
  nbaDecadePool,
  NBA_MASTER,
  NBA_FRANCHISES,
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
  soccerDecadePool,
  SOCCER_MASTER,
  SOCCER_TEAMS,
  soccerEligible,
  soccerRoles,
  (p) => [
    { label: "PAC", value: p.pace },
    { label: "SHO", value: p.shooting },
    { label: "PAS", value: p.passing },
    { label: "DEF", value: p.defending },
  ]
);
