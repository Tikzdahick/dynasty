// Local-storage persistence used in guest mode and as an offline mirror.
import {
  NbaLeaderboardEntry,
  SoccerLeaderboardEntry,
} from "@/types";

const NBA_KEY = "dynasty.nba.entries";
const SOCCER_KEY = "dynasty.soccer.entries";
const GUEST_KEY = "dynasty.guestname";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalNba(): NbaLeaderboardEntry[] {
  return read<NbaLeaderboardEntry>(NBA_KEY);
}

export function addLocalNba(entry: NbaLeaderboardEntry) {
  const all = getLocalNba();
  all.push(entry);
  write(NBA_KEY, all);
}

export function getLocalSoccer(): SoccerLeaderboardEntry[] {
  return read<SoccerLeaderboardEntry>(SOCCER_KEY);
}

export function addLocalSoccer(entry: SoccerLeaderboardEntry) {
  const all = getLocalSoccer();
  all.push(entry);
  write(SOCCER_KEY, all);
}

export function getGuestName(): string {
  if (typeof window === "undefined") return "Guest";
  return localStorage.getItem(GUEST_KEY) || "";
}

export function setGuestName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_KEY, name);
}
