// NBA teams used for the new-user Starter Pack picker. Pure data (no imports
// from cards.ts) to avoid a cycle — cards.ts reads this to generate each team's
// Bronze/Silver commons. Logos are stylised colour badges (no trademarked art).
export interface TeamMeta {
  id: string; // lowercase slug
  abbr: string; // 3-letter badge text
  city: string;
  name: string;
  primary: string;
  secondary: string;
}

export const TEAMS: TeamMeta[] = [
  { id: "lakers", abbr: "LAL", city: "Los Angeles", name: "Lakers", primary: "#552583", secondary: "#FDB927" },
  { id: "celtics", abbr: "BOS", city: "Boston", name: "Celtics", primary: "#007A33", secondary: "#BA9653" },
  { id: "warriors", abbr: "GSW", city: "Golden State", name: "Warriors", primary: "#1D428A", secondary: "#FFC72C" },
  { id: "bulls", abbr: "CHI", city: "Chicago", name: "Bulls", primary: "#CE1141", secondary: "#111111" },
  { id: "heat", abbr: "MIA", city: "Miami", name: "Heat", primary: "#98002E", secondary: "#F9A01B" },
  { id: "knicks", abbr: "NYK", city: "New York", name: "Knicks", primary: "#006BB6", secondary: "#F58426" },
  { id: "bucks", abbr: "MIL", city: "Milwaukee", name: "Bucks", primary: "#00471B", secondary: "#EEE1C6" },
  { id: "suns", abbr: "PHX", city: "Phoenix", name: "Suns", primary: "#1D1160", secondary: "#E56020" },
  { id: "mavericks", abbr: "DAL", city: "Dallas", name: "Mavericks", primary: "#00538C", secondary: "#B8C4CA" },
  { id: "nuggets", abbr: "DEN", city: "Denver", name: "Nuggets", primary: "#0E2240", secondary: "#FEC524" },
  { id: "sixers", abbr: "PHI", city: "Philadelphia", name: "76ers", primary: "#006BB6", secondary: "#ED174C" },
  { id: "nets", abbr: "BKN", city: "Brooklyn", name: "Nets", primary: "#1A1A1A", secondary: "#FFFFFF" },
];

export function teamById(id: string): TeamMeta | undefined {
  return TEAMS.find((t) => t.id === id);
}

export function teamByAbbr(abbr: string): TeamMeta | undefined {
  return TEAMS.find((t) => t.abbr === abbr);
}
