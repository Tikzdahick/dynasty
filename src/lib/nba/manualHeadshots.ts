// Hand-sourced headshots for players the automated backfill can't cover — they
// have no nbaPlayerId in the main roster AND no Wikipedia lead image. Kept
// separate from the auto-generated wikipediaImages.ts so a regen won't clobber
// them. Every entry was verified by eye (correct person, real photo not the
// nba.com silhouette placeholder).

// slug -> nba.com person id (served via the /api/nba-headshot proxy)
export const MANUAL_NBA_IDS: Record<string, number> = {
  "anthony-mason": 193, // nba.com headshot, Bucks-era, verified
  "steve-smith": 120, // Hawks guard (MSU, #8), verified
};

// slug -> direct image URL (Wikimedia Commons photos not linked as the article
// lead image, so the summary-based backfill misses them)
export const MANUAL_NBA_IMAGES: Record<string, string> = {
  // Kings-era photo (only free image available; he's in Kings gear)
  "bobby-jackson":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Bobby_Jackson_Kings.jpg/330px-Bobby_Jackson_Kings.jpg",
};
