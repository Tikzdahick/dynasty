// Admin session token: a signed, expiring cookie value. Uses Web Crypto only so
// it runs in the Edge middleware AND in route handlers. The signing key is the
// ADMIN_PASSWORD env secret, so a cookie can't be forged without it and rotating
// the password invalidates existing sessions.
export const ADMIN_COOKIE = "dyn_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

const enc = new TextEncoder();

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return toBase64Url(sig);
}

/** Constant-time string comparison (equal length assumed for the sig case). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mint a cookie token bound to `secret`, stamped with the issue time. */
export async function createToken(secret: string): Promise<string> {
  const value = String(Date.now());
  return `${value}.${await sign(value, secret)}`;
}

/** True only if the token is well-formed, correctly signed, and unexpired. */
export async function verifyToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const value = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await sign(value, secret);
  if (!safeEqual(sig, expected)) return false;
  const iat = Number(value);
  if (!Number.isFinite(iat)) return false;
  return Date.now() - iat <= ADMIN_MAX_AGE * 1000;
}

/** Constant-time compare of a submitted password to the configured secret. */
export function passwordMatches(input: string, secret: string): boolean {
  return safeEqual(input, secret);
}
