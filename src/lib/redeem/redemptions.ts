"use client";

import { normalizeCode, REDEEM_COOKIE, RedeemOverrides, parseOverrides } from "@/lib/redeem/codes";

// Per-browser record of which codes have been redeemed — the anti-spam gate.
// (No login exists, so "per user" is per browser.)
const KEY = "dynasty.redeem.used";

export function listRedeemed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

export function hasRedeemed(code: string): boolean {
  return listRedeemed().includes(normalizeCode(code));
}

export function markRedeemed(code: string): void {
  if (typeof window === "undefined") return;
  const norm = normalizeCode(code);
  const list = listRedeemed();
  if (!list.includes(norm)) {
    list.push(norm);
    localStorage.setItem(KEY, JSON.stringify(list));
  }
}

/** Read the admin per-browser override cookie on the client. */
export function readRedeemOverrides(): RedeemOverrides {
  if (typeof document === "undefined") return {};
  const m = document.cookie.split("; ").find((c) => c.startsWith(REDEEM_COOKIE + "="));
  return parseOverrides(m ? decodeURIComponent(m.slice(REDEEM_COOKIE.length + 1)) : undefined);
}
