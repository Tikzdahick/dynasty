import { NBA_PLAYERS } from "@/lib/nba/players";
import { NBA_WIKIPEDIA_IMAGES } from "@/lib/nba/wikipediaImages";
import { MANUAL_NBA_HEADSHOTS } from "@/lib/nba/manualHeadshots";
import { LOCAL_NBA_HEADSHOTS } from "@/lib/nba/localHeadshots";

// nba.com headshots break HTTP/2 in browsers, so they are proxied through our
// own origin (see src/app/api/nba-headshot/[id]/route.ts).
const NBA_ID_BY_SLUG = new Map(
  NBA_PLAYERS.filter((p) => p.nbaPlayerId != null).map((p) => [p.id, p.nbaPlayerId as number])
);

/**
 * The single source of NBA headshot resolution. Returns ordered image-source
 * candidates for any NBA player-like object — the Card model *and* raw NbaPlayer
 * objects (draft / sim / iconic teams), back-filling the nba id and the
 * Wikipedia fallback by slug id from the central registries so every render
 * location resolves identically. Empty array => render initials.
 */
export function nbaHeadshotSources(p: { id?: string; nbaPlayerId?: number | null }): string[] {
  const out: string[] = [];
  // 1. vendored local copy (self-hosted, no external dependency)
  if (p.id && LOCAL_NBA_HEADSHOTS[p.id]) out.push(LOCAL_NBA_HEADSHOTS[p.id]);
  // 2. manual override (corrects wrong matches / fills gaps)
  if (p.id && MANUAL_NBA_HEADSHOTS[p.id]) out.push(MANUAL_NBA_HEADSHOTS[p.id]);
  // 3. official nba.com headshot (proxied), by explicit id or slug back-fill
  const nbaId = p.nbaPlayerId ?? (p.id ? NBA_ID_BY_SLUG.get(p.id) : undefined);
  if (nbaId != null) out.push(`/api/nba-headshot/${nbaId}`);
  // 4. Wikipedia fallback
  const wiki = p.id ? NBA_WIKIPEDIA_IMAGES[p.id] : undefined;
  if (wiki) out.push(wiki);
  return [...new Set(out)];
}
