import { WIKIPEDIA_IMAGES } from "@/lib/soccer/wikipediaImages";

const ESPN_BASE = "https://a.espncdn.com/i/headshots/soccer/players/full";

/**
 * The single source of soccer headshot resolution. Returns ordered image-source
 * candidates for any soccer player-like object — the Card model *and* raw
 * SoccerPlayer objects (draft / sim / iconic teams), back-filling the Wikipedia
 * image by slug id from the central cache so every render location resolves
 * identically. Empty array => render initials.
 */
export function soccerHeadshotSources(p: {
  id?: string;
  espnPlayerId?: number | null;
  wikipediaImageUrl?: string | null;
}): string[] {
  const out: string[] = [];
  if (p.espnPlayerId != null) out.push(`${ESPN_BASE}/${p.espnPlayerId}.png`);
  const wiki = p.wikipediaImageUrl ?? (p.id ? WIKIPEDIA_IMAGES[p.id] : undefined);
  if (wiki) out.push(wiki);
  return out;
}
