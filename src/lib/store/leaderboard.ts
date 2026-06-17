import { getSupabase } from "@/lib/supabase/client";
import {
  NbaLeaderboardEntry,
  SoccerLeaderboardEntry,
} from "@/types";
import {
  addLocalNba,
  addLocalSoccer,
  getLocalNba,
  getLocalSoccer,
} from "./local";

export type TimeFilter = "all" | "week" | "month";

function withinFilter(iso: string, filter: TimeFilter): boolean {
  if (filter === "all") return true;
  const t = new Date(iso).getTime();
  const now = Date.now();
  const span = filter === "week" ? 7 : 30;
  return now - t <= span * 24 * 60 * 60 * 1000;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---------- NBA ----------
export async function saveNbaResult(
  entry: Omit<NbaLeaderboardEntry, "id" | "created_at">
): Promise<{ saved: "cloud" | "local" }> {
  const supabase = getSupabase();
  const record: NbaLeaderboardEntry = {
    ...entry,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  // Always mirror locally so the player sees it instantly.
  addLocalNba(record);

  if (supabase) {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { error } = await supabase.from("nba_results").insert({
        user_id: userData.user.id,
        username: entry.username,
        wins: entry.wins,
        losses: entry.losses,
        players: entry.players,
        rating: entry.rating,
        chemistry: entry.chemistry ?? null,
      });
      if (!error) return { saved: "cloud" };
    }
  }
  return { saved: "local" };
}

export async function getNbaLeaderboard(
  filter: TimeFilter
): Promise<NbaLeaderboardEntry[]> {
  const supabase = getSupabase();
  let rows: NbaLeaderboardEntry[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("nba_results")
      .select("*")
      .order("wins", { ascending: false })
      .limit(200);
    if (data) {
      rows = data.map((d: any) => ({
        id: d.id,
        username: d.username,
        wins: d.wins,
        losses: d.losses,
        players: d.players,
        rating: d.rating,
        chemistry: d.chemistry ?? undefined,
        created_at: d.created_at,
      }));
    }
  }
  // Merge local entries that aren't from cloud (guest mode / offline).
  const merged = [...rows, ...getLocalNba()];
  const seen = new Set<string>();
  return merged
    .filter((e) => withinFilter(e.created_at, filter))
    .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .slice(0, 100);
}

// ---------- Soccer ----------
const ROUND_RANK: Record<string, number> = {
  Champion: 7,
  Final: 6,
  "Semi-Final": 5,
  "Quarter-Final": 4,
  "Round of 16": 3,
  "Group Stage": 2,
};

export async function saveSoccerResult(
  entry: Omit<SoccerLeaderboardEntry, "id" | "created_at">
): Promise<{ saved: "cloud" | "local" }> {
  const supabase = getSupabase();
  const record: SoccerLeaderboardEntry = {
    ...entry,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  addLocalSoccer(record);

  if (supabase) {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { error } = await supabase.from("soccer_results").insert({
        user_id: userData.user.id,
        username: entry.username,
        result: entry.result,
        players: entry.players,
        formation: entry.formation,
        rating: entry.rating,
        chemistry: entry.chemistry ?? null,
      });
      if (!error) return { saved: "cloud" };
    }
  }
  return { saved: "local" };
}

export async function getSoccerLeaderboard(
  filter: TimeFilter
): Promise<SoccerLeaderboardEntry[]> {
  const supabase = getSupabase();
  let rows: SoccerLeaderboardEntry[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("soccer_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) {
      rows = data.map((d: any) => ({
        id: d.id,
        username: d.username,
        result: d.result,
        players: d.players,
        formation: d.formation,
        rating: d.rating,
        chemistry: d.chemistry ?? undefined,
        created_at: d.created_at,
      }));
    }
  }
  const merged = [...rows, ...getLocalSoccer()];
  const seen = new Set<string>();
  return merged
    .filter((e) => withinFilter(e.created_at, filter))
    .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
    .sort(
      (a, b) =>
        (ROUND_RANK[b.result] || 0) - (ROUND_RANK[a.result] || 0) ||
        b.rating - a.rating
    )
    .slice(0, 100);
}
