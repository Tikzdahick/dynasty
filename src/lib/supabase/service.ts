// Server-only Supabase access for privileged API routes (card grants, etc.).
// Uses the service-role key (never exposed to the client) and validates the
// caller's access token to resolve their user id. Import ONLY from route
// handlers / server code — never from a client component.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** A service-role client that bypasses RLS. Server-side use only. */
export function serviceClient(): SupabaseClient {
  if (!url || !serviceKey) throw new Error("Supabase service credentials are not configured");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Validate the Bearer access token on a request and return the user id (or
 *  null if missing/invalid). The token comes from the browser's Supabase
 *  session, so this authenticates the caller without trusting a client-sent id. */
export async function userIdFromRequest(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await serviceClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
