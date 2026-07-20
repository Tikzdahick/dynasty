// Manual per-player headshot overrides — HIGHEST priority in the resolver, so
// you can correct a wrong auto-matched photo (e.g. a Wikipedia disambiguation
// that landed on the wrong person) or fill a gap. Map the player's slug id to a
// full image URL. If the override URL fails to load, the resolver still falls
// through to the automatic ESPN/Wikipedia sources, so a bad override never
// breaks a card.
//
// Example:
//   "some-player": "https://upload.wikimedia.org/.../Correct_Photo.jpg",
export const MANUAL_SOCCER_HEADSHOTS: Record<string, string> = {};
