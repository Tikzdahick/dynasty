import { NBA_ICONIC } from "@/lib/nba/teams";
import { SOCCER_ICONIC, SOCCER_CLUBS } from "@/lib/soccer/teams";
import { IconicTeam } from "@/types";

export type ChemLabel = "Poor" | "Good" | "Elite";

export interface ChemistryGroup {
  key: string;
  team: string;
  decade: string;
  isClub: boolean;
  playerIds: string[];
}

export interface Chemistry {
  pct: number; // win-probability bonus (can be negative)
  label: ChemLabel;
  groups: ChemistryGroup[];
  note: string;
}

interface RosterPlayer {
  id: string;
  name: string;
}

// playerId -> list of (team, decade) memberships across all iconic rosters
function membership(iconic: IconicTeam<{ id: string }>[]) {
  const m = new Map<string, { team: string; decade: string }[]>();
  for (const t of iconic) {
    for (const p of t.players) {
      const arr = m.get(p.id) ?? [];
      arr.push({ team: t.team, decade: t.decade });
      m.set(p.id, arr);
    }
  }
  return m;
}

const NBA_MEM = membership(NBA_ICONIC);
const SOCCER_MEM = membership(SOCCER_ICONIC);

function groupsFor(
  mem: Map<string, { team: string; decade: string }[]>,
  players: RosterPlayer[]
): ChemistryGroup[] {
  const byKey = new Map<string, { team: string; decade: string; ids: string[] }>();
  for (const p of players) {
    for (const { team, decade } of mem.get(p.id) ?? []) {
      const key = `${decade}|${team}`;
      const g = byKey.get(key) ?? { team, decade, ids: [] };
      if (!g.ids.includes(p.id)) g.ids.push(p.id);
      byKey.set(key, g);
    }
  }
  const groups: ChemistryGroup[] = [];
  for (const [key, g] of byKey) {
    if (g.ids.length >= 2)
      groups.push({ key, team: g.team, decade: g.decade, isClub: false, playerIds: g.ids });
  }
  return groups.sort((a, b) => b.playerIds.length - a.playerIds.length);
}

function labelFor(pct: number): ChemLabel {
  return pct >= 10 ? "Elite" : pct >= 4 ? "Good" : "Poor";
}

export function computeChemistry(
  sport: "nba" | "soccer",
  players: RosterPlayer[]
): Chemistry {
  if (sport === "nba") {
    const groups = groupsFor(NBA_MEM, players);
    const best = groups[0]?.playerIds.length ?? 0;
    let pct = best >= 4 ? 12 : best === 3 ? 7 : best >= 2 ? 3 : 0;
    let note: string;
    if (best < 2) {
      pct = -5;
      note = "Five different eras, no shared lineups — zero cohesion.";
    } else {
      if (groups.length > 1) pct = Math.min(15, pct + (groups.length - 1) * 2);
      note = `${best} ${groups[0].decade} ${groups[0].team} teammates reunited.`;
    }
    return { pct, label: labelFor(pct), groups, note };
  }

  // soccer
  const groups = groupsFor(SOCCER_MEM, players).map((g) => ({
    ...g,
    isClub: SOCCER_CLUBS.has(g.team),
  }));
  const nation = groups.filter((g) => !g.isClub);
  const clubs = groups.filter((g) => g.isClub);
  const bestNation = nation[0]?.playerIds.length ?? 0;
  let base = bestNation >= 6 ? 12 : bestNation >= 4 ? 7 : bestNation >= 2 ? 3 : 0;
  const clubBonus = clubs.some((g) => g.playerIds.length >= 2) ? 5 : 0;
  let pct = base + clubBonus;
  let note: string;
  if (pct <= 0) {
    pct = -3;
    note = "A team of strangers — no shared caps.";
  } else if (clubBonus && bestNation >= 2) {
    note = `Club & country links — ${nation[0].team} core plus a club spine.`;
  } else if (clubBonus) {
    note = `Club spine from ${clubs[0].team} ${clubs[0].decade}.`;
  } else {
    note = `${bestNation} ${nation[0].team} countrymen in the XI.`;
  }
  return { pct, label: labelFor(pct), groups, note };
}
