import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, createToken, passwordMatches } from "@/lib/admin/session";

export const runtime = "nodejs";

// Only allow same-origin relative paths as the post-login redirect target.
function safeNext(next: string | null): string {
  if (next && next.startsWith("/admin") && !next.startsWith("/admin/login")) return next;
  return "/admin";
}

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_PASSWORD;
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? ""));

  const loginUrl = new URL("/admin/login", req.url);

  if (!secret) {
    loginUrl.searchParams.set("error", "unconfigured");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }
  if (!passwordMatches(password, secret)) {
    loginUrl.searchParams.set("error", "1");
    if (next !== "/admin") loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.cookies.set(ADMIN_COOKIE, await createToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  return res;
}
