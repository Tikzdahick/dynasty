// Redeem codes. Same no-backend model as flags/odds: the shipped defaults below
// are what every player's /redeem page checks against; the admin can layer
// per-browser overrides (toggle active, add a test code) via the
// `dyn_redeem_codes` cookie. Shipping a NEW code to all players means adding it
// here and redeploying (there's no shared DB to persist admin-created codes).
//
// `reward_type` is "coins" — the in-game currency (Dynasty Coins).

export interface RedeemCode {
  code: string;
  reward_amount: number;
  reward_type: "coins";
  max_uses: number | null; // null = unlimited. Global cap; per-browser we enforce once-per-code.
  active: boolean;
}

export const REDEEM_CODES: RedeemCode[] = [
  { code: "2040", reward_amount: 100000, reward_type: "coins", max_uses: null, active: true },
];

export const REDEEM_COOKIE = "dyn_redeem_codes";

export interface RedeemOverrides {
  toggles?: Record<string, boolean>; // normalized code -> active override
  added?: RedeemCode[]; // extra codes added for this browser (admin testing)
}

export function normalizeCode(s: string): string {
  return s.trim().toUpperCase();
}

function b64encode(s: string): string {
  return typeof btoa !== "undefined" ? btoa(s) : Buffer.from(s, "utf8").toString("base64");
}
function b64decode(s: string): string {
  return typeof atob !== "undefined" ? atob(s) : Buffer.from(s, "base64").toString("utf8");
}

export function encodeOverrides(o: RedeemOverrides): string {
  return b64encode(JSON.stringify(o));
}

export function parseOverrides(raw: string | undefined | null): RedeemOverrides {
  if (!raw) return {};
  let json = raw;
  try {
    json = b64decode(raw);
  } catch {
    /* maybe raw JSON */
  }
  try {
    const obj = JSON.parse(json) as RedeemOverrides;
    const out: RedeemOverrides = {};
    if (obj.toggles && typeof obj.toggles === "object") {
      out.toggles = {};
      for (const k of Object.keys(obj.toggles)) {
        if (typeof obj.toggles[k] === "boolean") out.toggles[normalizeCode(k)] = obj.toggles[k];
      }
    }
    if (Array.isArray(obj.added)) {
      out.added = obj.added
        .filter((c) => c && typeof c.code === "string" && typeof c.reward_amount === "number")
        .map((c) => ({
          code: normalizeCode(c.code),
          reward_amount: Math.max(0, Math.round(c.reward_amount)),
          reward_type: "coins" as const,
          max_uses: c.max_uses == null ? null : Math.max(1, Math.round(c.max_uses)),
          active: c.active !== false,
        }));
    }
    return out;
  } catch {
    return {};
  }
}

/** Shipped codes with per-browser overrides applied (toggles + added codes). */
export function effectiveCodes(overrides: RedeemOverrides): RedeemCode[] {
  const byCode = new Map<string, RedeemCode>();
  for (const c of REDEEM_CODES) byCode.set(normalizeCode(c.code), { ...c, code: normalizeCode(c.code) });
  for (const c of overrides.added ?? []) byCode.set(normalizeCode(c.code), c);
  if (overrides.toggles) {
    for (const [code, active] of Object.entries(overrides.toggles)) {
      const existing = byCode.get(code);
      if (existing) byCode.set(code, { ...existing, active });
    }
  }
  return [...byCode.values()];
}

export function findCode(input: string, overrides: RedeemOverrides): RedeemCode | undefined {
  const norm = normalizeCode(input);
  return effectiveCodes(overrides).find((c) => normalizeCode(c.code) === norm);
}
