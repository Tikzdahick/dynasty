import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/admin/session";
import { PACK_ODDS_COOKIE, PackOddsOverrides, RARITIES, encodePackOdds } from "@/lib/admin/packOdds";

export const runtime = "nodejs";

const VALID_RARITY = new Set(RARITIES);
const VALID_SPORT = new Set(["nba", "soccer"]);

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const action = String(form.get("action") ?? "save");
  const redirect = NextResponse.redirect(new URL("/admin/odds", req.url), { status: 303 });

  if (action === "reset") {
    redirect.cookies.set(PACK_ODDS_COOKIE, "", { path: "/", maxAge: 0 });
    return redirect;
  }

  // Collect fields named  w:<sport>:<packId>:<rarity>  = weight
  const overrides: PackOddsOverrides = {};
  for (const [name, value] of form.entries()) {
    if (!name.startsWith("w:")) continue;
    const [, sport, packId, rarity] = name.split(":");
    if (!VALID_SPORT.has(sport) || !packId || !VALID_RARITY.has(rarity)) continue;
    const w = Number(value);
    if (!Number.isFinite(w) || w < 0) continue;
    ((overrides[sport] ??= {})[packId] ??= {})[rarity] = w;
  }

  redirect.cookies.set(PACK_ODDS_COOKIE, encodePackOdds(overrides), {
    httpOnly: false, // read client-side at pack-open time
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return redirect;
}
