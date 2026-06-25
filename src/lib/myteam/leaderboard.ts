// MyTeam leaderboard — ranks the local user against a roster of bot rivals.
//
// NOTE: bot rivals are generated deterministically so the board is stable; the
// user's row updates live as they play. For true cross-user rankings, replace
// `botRivals()` with a Supabase query of users' team OVR + records; `rankEntries`
// and the UI stay the same.
import { mulberry32, seedFromString } from "@/lib/rng";
import { CARD_POOL, Card } from "@/lib/myteam/cards";

export interface LeaderboardEntry {
  username: string;
  teamOvr: number;
  wins: number;
  losses: number;
  bestCardId: string | null;
  isYou: boolean;
  rank: number;
}

const BOT_NAMES = [
  "CourtVision", "RingChaser", "TheCommish", "ColdBlooded", "FastBreak",
  "DimeMachine", "SwishGod", "PaintPatrol", "AnkleSnatch", "GlassEater",
  "ClutchTime", "PosterKing", "BenchBoss", "TripleStack", "FadeKing",
  "DeepThree", "PickAndRoll", "RimProtector", "FloorGeneral", "SixthMan",
  "BuzzerBeat", "AlleyOop", "FullCourt", "ZoneBuster", "IsoHunter",
  "TheArchitect", "CapSpace", "DraftGuru", "Hardwood", "MambaMode",
];

/** Composite score used for ranking: team quality + match results. */
export function entryScore(e: { teamOvr: number; wins: number; losses: number }): number {
  return e.teamOvr * 2 + e.wins * 3 - e.losses;
}

// pick a believable "best card" near a target overall
function bestCardNear(target: number, rng: () => number): string {
  const eligible = CARD_POOL.filter((c) => !c.moment);
  const pool = eligible.filter((c) => Math.abs(c.overall - target) <= 3);
  const src = pool.length ? pool : eligible;
  return src[Math.floor(rng() * src.length)].id;
}

export interface RivalBase {
  username: string;
  teamOvr: number;
  wins: number;
  losses: number;
  bestCardId: string;
}

/** Deterministic roster of rival GMs (stable across reloads). */
export function botRivals(): RivalBase[] {
  const rng = mulberry32(seedFromString("dynasty:myteam:leaderboard:v1"));
  return BOT_NAMES.map((username) => {
    const teamOvr = Math.round(72 + rng() * 24); // 72–96
    const games = 10 + Math.floor(rng() * 60);
    // stronger teams win a bit more
    const winRate = Math.min(0.92, Math.max(0.12, (teamOvr - 68) / 32 + (rng() - 0.5) * 0.2));
    const wins = Math.round(games * winRate);
    const losses = games - wins;
    return { username, teamOvr, wins, losses, bestCardId: bestCardNear(teamOvr, rng) };
  });
}

export interface UserStanding {
  username: string;
  teamOvr: number;
  wins: number;
  losses: number;
  bestCard: Card | null;
}

export function buildLeaderboard(
  user: UserStanding,
  rivalDeltas: Record<string, { wins: number; losses: number }> = {}
): LeaderboardEntry[] {
  const rivals: LeaderboardEntry[] = botRivals().map((b) => {
    const d = rivalDeltas[b.username];
    return {
      ...b,
      wins: b.wins + (d?.wins ?? 0),
      losses: b.losses + (d?.losses ?? 0),
      isYou: false,
      rank: 0,
    };
  });
  rivals.push({
    username: user.username,
    teamOvr: user.teamOvr,
    wins: user.wins,
    losses: user.losses,
    bestCardId: user.bestCard?.id ?? null,
    isYou: true,
    rank: 0,
  });
  rivals.sort((a, b) => entryScore(b) - entryScore(a));
  rivals.forEach((e, i) => (e.rank = i + 1));
  return rivals;
}
