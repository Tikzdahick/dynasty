import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/admin/session";
import {
  REDEEM_COOKIE,
  RedeemCode,
  encodeOverrides,
  normalizeCode,
  parseOverrides,
} from "@/lib/redeem/codes";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const action = String(form.get("action") ?? "");
  const overrides = parseOverrides(req.cookies.get(REDEEM_COOKIE)?.value);
  const redirect = NextResponse.redirect(new URL("/admin/redeem", req.url), { status: 303 });

  if (action === "reset") {
    redirect.cookies.set(REDEEM_COOKIE, "", { path: "/", maxAge: 0 });
    return redirect;
  }

  const code = normalizeCode(String(form.get("code") ?? ""));

  if (action === "toggle") {
    if (code) (overrides.toggles ??= {})[code] = String(form.get("active")) === "true";
  } else if (action === "add") {
    const amount = Math.max(0, Math.round(Number(form.get("amount") ?? 0)));
    const maxRaw = String(form.get("max_uses") ?? "").trim();
    const max_uses = maxRaw === "" ? null : Math.max(1, Math.round(Number(maxRaw)));
    if (code && amount > 0) {
      const next: RedeemCode = { code, reward_amount: amount, reward_type: "coins", max_uses, active: true };
      overrides.added = [...(overrides.added ?? []).filter((c) => normalizeCode(c.code) !== code), next];
    }
  } else if (action === "remove") {
    overrides.added = (overrides.added ?? []).filter((c) => normalizeCode(c.code) !== code);
    if (overrides.toggles) delete overrides.toggles[code];
  } else {
    return NextResponse.json({ error: "Bad action" }, { status: 400 });
  }

  redirect.cookies.set(REDEEM_COOKIE, encodeOverrides(overrides), {
    httpOnly: false, // the /redeem page reads this at render time
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return redirect;
}
