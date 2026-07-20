import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/admin/session";
import { FLAGS_COOKIE, FlagKey, FLAGS, encodeOverrides, parseOverrides } from "@/lib/flags/flags";

export const runtime = "nodejs";

const VALID_KEYS = new Set(FLAGS.map((f) => f.key));

export async function POST(req: NextRequest) {
  // This route isn't under the /admin middleware matcher, so gate it here.
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const key = String(form.get("key") ?? "") as FlagKey;
  const action = String(form.get("action") ?? ""); // "on" | "off" | "reset"
  if (!VALID_KEYS.has(key)) {
    return NextResponse.json({ error: "Unknown flag" }, { status: 400 });
  }

  const overrides = parseOverrides(req.cookies.get(FLAGS_COOKIE)?.value);
  if (action === "reset") delete overrides[key];
  else if (action === "on") overrides[key] = true;
  else if (action === "off") overrides[key] = false;
  else return NextResponse.json({ error: "Bad action" }, { status: 400 });

  const res = NextResponse.redirect(new URL("/admin/flags", req.url), { status: 303 });
  res.cookies.set(FLAGS_COOKIE, encodeOverrides(overrides), {
    httpOnly: false, // client components read this at render time
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
