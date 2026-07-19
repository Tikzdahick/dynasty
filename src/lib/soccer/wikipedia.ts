// Wikipedia headshot lookup for soccer players. Used to resolve a portrait when
// a player has no espnPlayerId. In production the app reads pre-fetched URLs from
// the generated wikipediaImages.ts cache (so there are no per-load network calls);
// this function is the shared logic that the one-time fetch script uses to build
// that cache, and it stays available for any ad-hoc lookup.
import overrides from "./wikiTitleOverrides.json";

// Players whose Wikipedia article title differs from their in-game name
// (accents, disambiguation, etc.). Single source of truth — the fetch script
// reads this same JSON. Extend it as the test run surfaces misses.
export const WIKI_TITLE_OVERRIDES: Record<string, string> = overrides;

/** Resolve a player's Wikipedia lead-image thumbnail URL, or null if there
 *  isn't one (404 / disambiguation / no image). Never throws. */
export async function getWikipediaImage(playerName: string): Promise<string | null> {
  const title = WIKI_TITLE_OVERRIDES[playerName] ?? playerName.replace(/ /g, "_");
  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const res = await fetch(endpoint, {
      // Wikipedia requires a descriptive User-Agent or it may reject the request.
      headers: {
        "User-Agent": "DynastyGame/1.0 (soccer player card headshots)",
        accept: "application/json",
      },
    });
    // 404 = title needs disambiguation/override; any non-2xx → no image.
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}
