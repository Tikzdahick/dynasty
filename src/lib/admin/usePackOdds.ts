"use client";

import { useEffect, useState } from "react";
import { PACK_ODDS_COOKIE, PackOddsOverrides, parsePackOdds } from "@/lib/admin/packOdds";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : undefined;
}

/** Per-browser pack-odds overrides, read at render time (reconciled after mount). */
export function usePackOdds(): PackOddsOverrides {
  const [odds, setOdds] = useState<PackOddsOverrides>({});
  useEffect(() => {
    setOdds(parsePackOdds(readCookie(PACK_ODDS_COOKIE)));
  }, []);
  return odds;
}
