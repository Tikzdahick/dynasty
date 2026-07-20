// Feature flags. Two layers:
//   - global DEFAULT, defined here in code (changing it for everyone is a
//     one-line edit + redeploy — there's no shared DB to persist a global toggle)
//   - per-browser OVERRIDE, stored in the `dyn_flags` cookie and toggled from the
//     admin dashboard. This is the "flip it on for your own testing before
//     enabling globally" layer.
// Effective value = override ?? default. Read at render time via useFlags()
// (client) or readFlags() (server).

export type FlagKey = "auction_house" | "moments" | "sbc" | "evolutions" | "clubs";

export interface FlagDef {
  key: FlagKey;
  label: string;
  description: string;
  default: boolean;
  wired?: boolean; // true once the flag actually gates something in the UI
}

export const FLAGS: FlagDef[] = [
  { key: "auction_house", label: "Auction House", description: "Show the Auction House entry in the MyTeam hub.", default: true, wired: true },
  { key: "moments", label: "Moments Cards", description: "Show the limited-time Moments entry in the MyTeam hub.", default: true, wired: true },
  { key: "sbc", label: "SBCs", description: "Squad Building Challenges (feature not built yet).", default: false },
  { key: "evolutions", label: "Evolutions", description: "Player evolution upgrades (feature not built yet).", default: false },
  { key: "clubs", label: "Clubs", description: "Player clubs / guilds (feature not built yet).", default: false },
];

export const FLAG_DEFAULTS = Object.fromEntries(FLAGS.map((f) => [f.key, f.default])) as Record<FlagKey, boolean>;

export const FLAGS_COOKIE = "dyn_flags";
const VALID = new Set(FLAGS.map((f) => f.key));

function b64encode(s: string): string {
  return typeof btoa !== "undefined" ? btoa(s) : Buffer.from(s, "utf8").toString("base64");
}
function b64decode(s: string): string {
  return typeof atob !== "undefined" ? atob(s) : Buffer.from(s, "base64").toString("utf8");
}

export function encodeOverrides(overrides: Partial<Record<FlagKey, boolean>>): string {
  return b64encode(JSON.stringify(overrides));
}

/** Parse the cookie value into overrides. Tolerates base64 or raw JSON. */
export function parseOverrides(raw: string | undefined | null): Partial<Record<FlagKey, boolean>> {
  if (!raw) return {};
  let json = raw;
  try {
    json = b64decode(raw);
  } catch {
    /* maybe already plain JSON */
  }
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    const out: Partial<Record<FlagKey, boolean>> = {};
    for (const k of Object.keys(obj)) {
      if (VALID.has(k as FlagKey) && typeof obj[k] === "boolean") out[k as FlagKey] = obj[k] as boolean;
    }
    return out;
  } catch {
    return {};
  }
}

export function effectiveFlags(overrides: Partial<Record<FlagKey, boolean>>): Record<FlagKey, boolean> {
  return { ...FLAG_DEFAULTS, ...overrides };
}
