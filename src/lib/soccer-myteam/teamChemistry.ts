// Team chemistry — FIFA-Ultimate-Team style. Players who share a national team
// (country) or a club build chemistry links; bigger shared blocks give a larger
// team-rating bonus, so a themed XI (e.g. a Brazil core, or a Barcelona spine)
// performs better. Starter-pack "team" affiliation (the generated commons) still
// counts as a link too, so early squads built from a Starter Pack keep chemistry.
import { Card } from "@/lib/soccer-myteam/cards";

export type ChemLabel = "None" | "Decent" | "Strong" | "Elite";
export type ChemKind = "country" | "club" | "team";

export interface ChemGroup {
  team: string; // the shared attribute's display label (country / club / starter-pack)
  count: number;
  kind?: ChemKind;
}

export interface TeamChemistry {
  rating: number; // 0–100
  bonus: number; // overall points added to the team rating
  label: ChemLabel;
  groups: ChemGroup[];
}

// Points per extra member of a shared block, by link kind. Club links are worth
// a touch more than country (tighter familiarity), both above nothing.
const WEIGHTS: Record<ChemKind, number> = { club: 10, country: 8, team: 8 };

function groupsFor(
  cards: Card[],
  kind: ChemKind,
  pick: (c: Card) => string | undefined
): ChemGroup[] {
  const counts = new Map<string, number>();
  for (const c of cards) {
    const key = pick(c);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([team, count]) => ({ team, count, kind }));
}

export function computeTeamChemistry(cards: Card[]): TeamChemistry {
  const groups: ChemGroup[] = [
    ...groupsFor(cards, "country", (c) => c.country),
    ...groupsFor(cards, "club", (c) => c.club),
    ...groupsFor(cards, "team", (c) => c.team),
  ].sort((a, b) => b.count - a.count);

  let points = 0;
  for (const g of groups) points += (g.count - 1) * WEIGHTS[g.kind ?? "country"];
  const rating = Math.max(0, Math.min(100, points));
  const bonus = Math.round((rating / 100) * 5); // up to +5 OVR

  const label: ChemLabel =
    rating >= 70 ? "Elite" : rating >= 40 ? "Strong" : rating >= 15 ? "Decent" : "None";

  return { rating, bonus, label, groups };
}

export const CHEM_COLORS: Record<ChemLabel, string> = {
  None: "text-white/40",
  Decent: "text-sky-300",
  Strong: "text-emerald-300",
  Elite: "text-amber-300",
};

// Small icon per link kind for the chemistry-links display.
export const CHEM_KIND_ICON: Record<ChemKind, string> = {
  country: "🌍",
  club: "🛡️",
  team: "⭐",
};
