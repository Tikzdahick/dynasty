// Pack-odds overrides. Same model as feature flags: the code holds the default
// weights (in lib/{myteam,soccer-myteam}/packs.ts); the admin can override them
// per-browser via the `dyn_pack_odds` cookie, applied at pack-open time. Weights
// are relative (normalised when rolling), so the UI shows them as percentages.
import { RARITY_ORDER } from "@/lib/myteam/cards";

export const PACK_ODDS_COOKIE = "dyn_pack_odds";
export type Sport = "nba" | "soccer";
export const RARITIES = RARITY_ORDER as readonly string[];

// sport -> packId -> rarity -> weight
export type PackOddsOverrides = Record<string, Record<string, Record<string, number>>>;

function b64encode(s: string): string {
  return typeof btoa !== "undefined" ? btoa(s) : Buffer.from(s, "utf8").toString("base64");
}
function b64decode(s: string): string {
  return typeof atob !== "undefined" ? atob(s) : Buffer.from(s, "base64").toString("utf8");
}

export function encodePackOdds(o: PackOddsOverrides): string {
  return b64encode(JSON.stringify(o));
}

const VALID_RARITY = new Set(RARITIES);

export function parsePackOdds(raw: string | undefined | null): PackOddsOverrides {
  if (!raw) return {};
  let json = raw;
  try {
    json = b64decode(raw);
  } catch {
    /* maybe raw JSON */
  }
  try {
    const obj = JSON.parse(json) as PackOddsOverrides;
    const out: PackOddsOverrides = {};
    for (const sport of Object.keys(obj)) {
      const packs = obj[sport];
      if (!packs || typeof packs !== "object") continue;
      for (const packId of Object.keys(packs)) {
        const weights = packs[packId];
        if (!weights || typeof weights !== "object") continue;
        for (const rarity of Object.keys(weights)) {
          const w = weights[rarity];
          if (!VALID_RARITY.has(rarity) || typeof w !== "number" || !Number.isFinite(w) || w < 0) continue;
          ((out[sport] ??= {})[packId] ??= {})[rarity] = w;
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Merge an override (if any) over a pack's default weights. */
export function effectiveWeights(
  sport: Sport,
  packId: string,
  defaults: Partial<Record<string, number>>,
  overrides: PackOddsOverrides
): Record<string, number> {
  const base: Record<string, number> = {};
  for (const r of RARITIES) base[r] = defaults[r] ?? 0;
  const ov = overrides?.[sport]?.[packId];
  if (ov) for (const r of Object.keys(ov)) base[r] = ov[r];
  return base;
}

/** Whether a pack has a stored override. */
export function isOverridden(sport: Sport, packId: string, overrides: PackOddsOverrides): boolean {
  return Boolean(overrides?.[sport]?.[packId]);
}

/** Convert weights to display percentages (sum-normalised, one decimal). */
export function toPercents(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((a, w) => a + (w > 0 ? w : 0), 0) || 1;
  const out: Record<string, number> = {};
  for (const r of RARITIES) out[r] = Math.round(((weights[r] > 0 ? weights[r] : 0) / total) * 1000) / 10;
  return out;
}

/** Apply a pack's override (if any) to its weights, returning a new pack. */
export function applyPackOverride<T extends { id: string; weights: Partial<Record<string, number>> }>(
  sport: Sport,
  pack: T,
  overrides: PackOddsOverrides
): T {
  const ov = overrides?.[sport]?.[pack.id];
  if (!ov) return pack;
  return { ...pack, weights: { ...pack.weights, ...ov } };
}
