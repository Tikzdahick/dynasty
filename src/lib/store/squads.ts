// Squad sharing — likes + the user's public-share flag. Browsable squads are
// generated from the rival pool (see lib/myteam/squads.ts). Local-first; a real
// version would persist squads + likes in Supabase.
import { mulberry32, seedFromString } from "@/lib/rng";

const LIKES_KEY = "dynasty.squads.likes"; // squad ids the user has liked
const SHARE_KEY = "dynasty.squads.shared"; // "1" if the user shared their squad

function readLiked(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

export function isLiked(id: string): boolean {
  return readLiked().includes(id);
}

export function toggleLike(id: string): boolean {
  if (typeof window === "undefined") return false;
  const liked = readLiked();
  const i = liked.indexOf(id);
  if (i >= 0) liked.splice(i, 1);
  else liked.push(id);
  localStorage.setItem(LIKES_KEY, JSON.stringify(liked));
  return liked.includes(id);
}

/** Deterministic base like-count for a bot squad, plus the user's like. */
export function likeCount(id: string): number {
  const base = Math.floor(mulberry32(seedFromString(`likes:${id}`))() * 240) + 5;
  return base + (isLiked(id) ? 1 : 0);
}

export function isShared(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SHARE_KEY) === "1";
}

export function setShared(shared: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHARE_KEY, shared ? "1" : "0");
}
