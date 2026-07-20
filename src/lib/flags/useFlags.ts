"use client";

import { useEffect, useState } from "react";
import {
  FLAG_DEFAULTS,
  FLAGS_COOKIE,
  FlagKey,
  effectiveFlags,
  parseOverrides,
} from "@/lib/flags/flags";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : undefined;
}

/**
 * Render-time feature-flag read for client components. Starts from the code
 * defaults (so SSR/first paint is stable) and reconciles the per-browser
 * override cookie after mount.
 */
export function useFlags(): Record<FlagKey, boolean> {
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>(FLAG_DEFAULTS);
  useEffect(() => {
    setFlags(effectiveFlags(parseOverrides(readCookie(FLAGS_COOKIE))));
  }, []);
  return flags;
}

export function useFlag(key: FlagKey): boolean {
  return useFlags()[key];
}
