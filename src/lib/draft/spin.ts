import { Decade, DECADES, IconicTeam, SpinResult } from "@/types";
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
import { NbaPlayer, SoccerPlayer } from "@/types";

type Player = { id: string; overall: number };

interface SportData<P extends Player> {
  iconic: IconicTeam<P>[];
  decadePool: (d: Decade) => P[];
  teams: string[];
  master: P[];
  minOptions: number; // ensure at least this many total players to draft from
}

const NBA_DATA: SportData<NbaPlayer> = {
  iconic: NBA_ICONIC,
  decadePool: nbaDecadePool,
  teams: NBA_FRANCHISES,
  master: NBA_MASTER,
  minOptions: 16,
};

const SOCCER_DATA: SportData<SoccerPlayer> = {
  iconic: SOCCER_ICONIC,
  decadePool: soccerDecadePool,
  teams: SOCCER_TEAMS,
  master: SOCCER_MASTER,
  minOptions: 30,
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function best<P extends Player>(arr: P[]): P {
  return arr.reduce((a, b) => (b.overall > a.overall ? b : a));
}

// Pad `fill` from the all-time master pool so there are always enough
// players to complete a roster, even for thin decade/team combos.
function padFill<P extends Player>(
  data: SportData<P>,
  already: P[],
  fill: P[]
): P[] {
  const have = new Set([...already, ...fill].map((p) => p.id));
  if (already.length + fill.length >= data.minOptions) return fill;
  const ranked = [...data.master].sort((a, b) => b.overall - a.overall);
  const padded = [...fill];
  for (const p of ranked) {
    if (have.has(p.id)) continue;
    padded.push(p);
    have.add(p.id);
    if (already.length + padded.length >= data.minOptions) break;
  }
  return padded;
}

function resolve<P extends Player>(
  data: SportData<P>,
  decade: Decade,
  team: string
): SpinResult<P> {
  const iconic = data.iconic.find((t) => t.decade === decade && t.team === team);

  if (iconic) {
    const teamPlayers = iconic.players;
    const locked = best(teamPlayers);
    const teamIds = new Set(teamPlayers.map((p) => p.id));
    const fillBase = data.decadePool(decade).filter((p) => !teamIds.has(p.id));
    const fillPlayers = padFill(data, teamPlayers, fillBase);
    return {
      decade,
      team,
      label: iconic.label,
      source: "iconic",
      locked,
      teamPlayers,
      fillPlayers,
    };
  }

  // Fallback: no iconic roster → draft from the decade pool.
  const pool = data.decadePool(decade);
  const locked = pool.length ? best(pool) : best(data.master);
  const fillBase = pool.filter((p) => p.id !== locked.id);
  const fillPlayers = padFill(data, [locked], fillBase);
  return {
    decade,
    team,
    label: `${decade} ${team}`,
    source: "decade",
    locked,
    teamPlayers: [],
    fillPlayers,
  };
}

function spin<P extends Player>(data: SportData<P>): SpinResult<P> {
  // 75% land on a genuine iconic roster; 25% exercise the decade-pool fallback.
  if (Math.random() < 0.75 && data.iconic.length) {
    const t = pick(data.iconic);
    return resolve(data, t.decade, t.team);
  }
  const deep = DECADES.filter((d) => data.decadePool(d).length >= 4);
  const decade = pick(deep.length ? deep : DECADES);
  return resolve(data, decade, pick(data.teams));
}

export function spinNba(): SpinResult<NbaPlayer> {
  return spin(NBA_DATA);
}

export function spinSoccer(): SpinResult<SoccerPlayer> {
  return spin(SOCCER_DATA);
}

// Reel content for the slot-machine animation.
export const NBA_REEL_TEAMS = NBA_FRANCHISES;
export const SOCCER_REEL_TEAMS = SOCCER_TEAMS;
