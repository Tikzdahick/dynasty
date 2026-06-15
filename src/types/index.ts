// ---------- NBA ----------
export type NbaPosition = "PG" | "SG" | "SF" | "PF" | "C";

export interface NbaPlayer {
  id: string;
  name: string;
  era: string;
  position: NbaPosition;
  ppg: number;
  rpg: number;
  apg: number;
  overall: number; // 1-100
  cost: number; // draft points
}

export interface NbaGameResult {
  game: number;
  opponent: string;
  teamScore: number;
  oppScore: number;
  win: boolean;
}

export interface NbaSeasonResult {
  wins: number;
  losses: number;
  games: NbaGameResult[];
  teamRating: number;
}

// ---------- Soccer ----------
export type SoccerPosition = "GK" | "DEF" | "MID" | "FWD";

export interface SoccerPlayer {
  id: string;
  name: string;
  country: string;
  era: string;
  position: SoccerPosition;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  overall: number;
  cost: number;
}

export type FormationName = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1";

export interface FormationSlot {
  position: SoccerPosition;
  // grid coordinates on the pitch (0-100 each), x = width, y = depth (own goal -> opp goal)
  x: number;
  y: number;
}

export interface Formation {
  name: FormationName;
  slots: FormationSlot[]; // 11 outfield+gk slots, ordered
}

export interface MatchScorer {
  name: string;
  minute: number;
}

export interface SoccerMatchResult {
  round: string;
  opponent: string;
  teamGoals: number;
  oppGoals: number;
  scorers: MatchScorer[];
  oppScorers: MatchScorer[];
  win: boolean;
  draw: boolean;
  penalties?: { team: number; opp: number };
}

export interface SoccerTournamentResult {
  matches: SoccerMatchResult[];
  champion: boolean;
  reachedRound: string;
  teamRating: number;
}

// ---------- Leaderboard ----------
export interface NbaLeaderboardEntry {
  id: string;
  username: string;
  wins: number;
  losses: number;
  players: string[]; // 8 names
  rating: number;
  created_at: string;
}

export interface SoccerLeaderboardEntry {
  id: string;
  username: string;
  result: string; // e.g. "Champion", "Reached SF"
  players: string[]; // XI names
  formation: string;
  rating: number;
  created_at: string;
}
