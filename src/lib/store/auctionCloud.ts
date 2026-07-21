"use client";

// Real, server-authoritative auction house. All mutations go through the
// SECURITY DEFINER RPCs (list_card / buy_listing / cancel_listing) so a trade is
// atomic — coins and the card move together or not at all.
import { getSupabase } from "@/lib/supabase/client";

export type Sport = "nba" | "soccer";

export interface Listing {
  id: string;
  sport: Sport;
  cardIid: string;
  cardId: string;
  price: number;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  mine: boolean;
}

async function currentUid(sb: NonNullable<ReturnType<typeof getSupabase>>): Promise<string | null> {
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

/** Active listings for a sport, with seller display names resolved. */
export async function getMarket(sport: Sport): Promise<Listing[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const uid = await currentUid(sb);
  const { data, error } = await sb
    .from("auction_listings")
    .select("id,sport,card_iid,card_id,price,seller_id,created_at")
    .eq("sport", sport)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];

  // resolve seller display names (profiles is public-read)
  const sellerIds = [...new Set(data.map((r: any) => r.seller_id))];
  const names = new Map<string, string>();
  if (sellerIds.length) {
    const { data: profs } = await sb.from("profiles").select("user_id,display_name").in("user_id", sellerIds);
    for (const p of profs ?? []) names.set(p.user_id, p.display_name);
  }

  return data.map((r: any) => ({
    id: r.id,
    sport: r.sport,
    cardIid: r.card_iid,
    cardId: r.card_id,
    price: r.price,
    sellerId: r.seller_id,
    sellerName: names.get(r.seller_id) ?? "Player",
    createdAt: r.created_at,
    mine: r.seller_id === uid,
  }));
}

export async function listCard(sport: Sport, cardIid: string, price: number): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return "Not signed in.";
  const { error } = await sb.rpc("list_card", { p_sport: sport, p_card_iid: cardIid, p_price: price });
  return error ? error.message : null;
}

export async function buyListing(id: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return "Not signed in.";
  const { error } = await sb.rpc("buy_listing", { p_listing: id });
  return error ? error.message : null;
}

export async function cancelListing(id: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return "Not signed in.";
  const { error } = await sb.rpc("cancel_listing", { p_listing: id });
  return error ? error.message : null;
}
