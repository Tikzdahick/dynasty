import { WIKIPEDIA_IMAGES } from "@/lib/soccer/wikipediaImages";
import { MANUAL_SOCCER_HEADSHOTS } from "@/lib/soccer/manualHeadshots";
import { LOCAL_SOCCER_HEADSHOTS } from "@/lib/soccer/localHeadshots";

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
  // 1. vendored local copy (self-hosted, no external dependency)
  if (p.id && LOCAL_SOCCER_HEADSHOTS[p.id]) out.push(LOCAL_SOCCER_HEADSHOTS[p.id]);
  // 2. manual override (corrects wrong matches / fills gaps)
  if (p.id && MANUAL_SOCCER_HEADSHOTS[p.id]) out.push(MANUAL_SOCCER_HEADSHOTS[p.id]);
  // 3. ESPN headshot, then 4. Wikipedia — the onError chain falls ESPN -> wiki
  if (p.espnPlayerId != null) out.push(`${ESPN_BASE}/${p.espnPlayerId}.png`);
  const wiki = p.wikipediaImageUrl ?? (p.id ? WIKIPEDIA_IMAGES[p.id] : undefined);
  if (wiki) out.push(wiki);
  return [...new Set(out)];
}
