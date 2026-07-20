// Manual per-player headshot overrides — HIGHEST priority in the resolver, so
// you can (a) correct a wrong auto-matched photo (e.g. a Wikipedia disambiguation
// that landed on the wrong person) or (b) fill a gap where no automated source
// has an image. Map the player's slug id to a full image URL, or to the
// /api/nba-headshot/<id> proxy path for an nba.com headshot. If the override URL
// itself fails to load, the resolver still falls through to the automatic
// sources, so a bad override never breaks a card.
export const MANUAL_NBA_HEADSHOTS: Record<string, string> = {
  "anthony-mason": "/api/nba-headshot/193", // nba.com headshot, verified
  "steve-smith": "/api/nba-headshot/120", // Hawks guard (MSU, #8), verified
  "bobby-jackson":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Bobby_Jackson_Kings.jpg/330px-Bobby_Jackson_Kings.jpg",
};
