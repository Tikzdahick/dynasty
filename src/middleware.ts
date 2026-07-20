import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/admin/session";

// Server-side gate for the admin area. Every /admin route (except the login page)
// requires a valid signed admin cookie; this runs on the Edge before the page is
// ever rendered, so protected content is never sent to an unauthenticated client.
export const config = { matcher: ["/admin", "/admin/:path*"] };

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page must stay reachable without a session.
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.ADMIN_PASSWORD;
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";

  // Fail closed: if the admin secret isn't configured, no one gets in.
  if (!secret) {
    loginUrl.searchParams.set("error", "unconfigured");
    return NextResponse.redirect(loginUrl);
  }

  const ok = await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, secret);
  if (!ok) {
    if (pathname !== "/admin") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
