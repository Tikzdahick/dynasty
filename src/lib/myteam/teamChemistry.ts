// Team chemistry — cards from the same NBA team build chemistry, which adds a
// small overall/stat bonus so a themed roster performs better. (Legend/Moment
// cards aren't team-affiliated, so chemistry rewards building around a squad.)
import { Card } from "@/lib/myteam/cards";

export type ChemLabel = "None" | "Decent" | "Strong" | "Elite";

export interface TeamChemistry {
  rating: number; // 0–100
  bonus: number; // overall points added to the team rating
  label: ChemLabel;
  groups: { team: string; count: number }[];
}

export function computeTeamChemistry(cards: Card[]): TeamChemistry {
  const counts = new Map<string, number>();
  for (const c of cards) {
    if (!c.team) continue;
    counts.set(c.team, (counts.get(c.team) ?? 0) + 1);
  }
  const groups = [...counts.entries()]
    .map(([team, count]) => ({ team, count }))
    .filter((g) => g.count >= 2)
    .sort((a, b) => b.count - a.count);

  // each same-team pairing contributes; bigger blocks contribute more
  let points = 0;
  for (const g of groups) points += (g.count - 1) * 18;
  const rating = Math.max(0, Math.min(100, points));
  const bonus = Math.round((rating / 100) * 4); // up to +4 OVR

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
