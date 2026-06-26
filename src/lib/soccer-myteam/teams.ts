// Iconic soccer sides used for the new-user Starter Pack picker. Pure data (no
// imports from cards.ts) to avoid a cycle — cards.ts reads this to generate each
// side's Bronze/Silver commons. Badges are stylised colour crests (no
// trademarked art).
export interface TeamMeta {
  id: string; // lowercase slug
  abbr: string; // 3-letter badge text
  city: string; // confederation / region line
  name: string;
  primary: string;
  secondary: string;
}

export const TEAMS: TeamMeta[] = [
  { id: "brazil", abbr: "BRA", city: "Brazil", name: "Seleção", primary: "#009C3B", secondary: "#FFDF00" },
  { id: "argentina", abbr: "ARG", city: "Argentina", name: "Albiceleste", primary: "#75AADB", secondary: "#FFFFFF" },
  { id: "france", abbr: "FRA", city: "France", name: "Les Bleus", primary: "#1E2A78", secondary: "#EF3340" },
  { id: "germany", abbr: "GER", city: "Germany", name: "Die Mannschaft", primary: "#111111", secondary: "#DD0000" },
  { id: "spain", abbr: "ESP", city: "Spain", name: "La Roja", primary: "#AA151B", secondary: "#F1BF00" },
  { id: "italy", abbr: "ITA", city: "Italy", name: "Azzurri", primary: "#0066B3", secondary: "#FFFFFF" },
  { id: "england", abbr: "ENG", city: "England", name: "Three Lions", primary: "#FFFFFF", secondary: "#CF142B" },
  { id: "netherlands", abbr: "NED", city: "Netherlands", name: "Oranje", primary: "#FF6600", secondary: "#21468B" },
  { id: "portugal", abbr: "POR", city: "Portugal", name: "Seleção das Quinas", primary: "#006600", secondary: "#FF0000" },
  { id: "barcelona", abbr: "BAR", city: "Barcelona", name: "Blaugrana", primary: "#A50044", secondary: "#004D98" },
  { id: "realmadrid", abbr: "RMA", city: "Real Madrid", name: "Los Blancos", primary: "#FEBE10", secondary: "#00529F" },
  { id: "acmilan", abbr: "MIL", city: "AC Milan", name: "Rossoneri", primary: "#FB090B", secondary: "#000000" },
];

export function teamById(id: string): TeamMeta | undefined {
  return TEAMS.find((t) => t.id === id);
}

export function teamByAbbr(abbr: string): TeamMeta | undefined {
  return TEAMS.find((t) => t.abbr === abbr);
}
