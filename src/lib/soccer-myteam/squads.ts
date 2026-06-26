// Browsable squads for the Squads page: bot GMs' public teams plus (optionally)
// the user's shared squad. Each squad carries its roster, OVR, chemistry, and
// best card so the UI can render a rich preview.
import { Card } from "@/lib/soccer-myteam/cards";
import { botRivals } from "@/lib/soccer-myteam/leaderboard";
import { rivalRoster } from "@/lib/soccer-myteam/rivals";
import { computeTeamChemistry, TeamChemistry } from "@/lib/soccer-myteam/teamChemistry";

export interface Squad {
  id: string;
  owner: string;
  ovr: number;
  roster: Card[];
  bestCard: Card | null;
  chemistry: TeamChemistry;
  isYou: boolean;
}

function bestOf(cards: Card[]): Card | null {
  return cards.length ? cards.reduce((a, c) => (c.overall > a.overall ? c : a)) : null;
}

export function botSquads(): Squad[] {
  return botRivals().map((b) => {
    const roster = rivalRoster(b.username, b.teamOvr);
    return {
      id: `squad-${b.username}`,
      owner: b.username,
      ovr: b.teamOvr,
      roster,
      bestCard: bestOf(roster),
      chemistry: computeTeamChemistry(roster),
      isYou: false,
    };
  });
}

export function userSquad(owner: string, roster: Card[], ovr: number): Squad {
  return {
    id: "squad-you",
    owner,
    ovr,
    roster,
    bestCard: bestOf(roster),
    chemistry: computeTeamChemistry(roster),
    isYou: true,
  };
}
