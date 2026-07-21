// Logs a new account's IP + browser fingerprint for duplicate-account flagging
// (log only — no ban). The client calls this once after signup/first login; the
// server reads the real IP from the request and records it via log_signup.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { serviceClient, userIdFromRequest } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const uid = await userIdFromRequest(req);
  if (!uid) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  let fingerprint: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.fingerprint === "string") fingerprint = body.fingerprint.slice(0, 64);
  } catch {
    /* no body is fine */
  }

  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || null;

  try {
    const { data } = await serviceClient().rpc("log_signup", {
      p_user: uid, p_ip: ip, p_fingerprint: fingerprint,
    });
    return NextResponse.json({ flagged: data === true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }); // never block the user on a log failure
  }
}
