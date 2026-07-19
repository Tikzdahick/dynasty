// Soccer MyTeam — player card model. The all-time soccer legends become the
// Gold/Diamond/Dynasty chase cards; a deterministic pool of generated "rotation"
// players fills the Bronze/Silver commons so the pack economy feels like FUT
// (most pulls common, top tiers rare). Everything here is stable across reloads
// so a stored card id always resolves to the same card.
import { SoccerPlayer, SoccerPosition } from "@/types";
import { SOCCER_MASTER } from "@/lib/soccer/teams";
import { mulberry32, seedFromString } from "@/lib/rng";
import { TEAMS } from "@/lib/soccer-myteam/teams";
import { WIKIPEDIA_IMAGES } from "@/lib/soccer/wikipediaImages";

// Player id slug (matches SoccerPlayer.id) -> used to look up the cached
// Wikipedia headshot by name for cards that carry a name but no player id.
function slugId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export type Rarity = "Bronze" | "Silver" | "Gold" | "Diamond" | "Dynasty";

export const RARITY_ORDER: Rarity[] = ["Bronze", "Silver", "Gold", "Diamond", "Dynasty"];

export interface RarityTier {
  rarity: Rarity;
  min: number;
  max: number;
  label: string;
  ring: string;
  glow: string;
  grad: string;
  text: string;
  chip: string;
}

export const RARITY_TIERS: Record<Rarity, RarityTier> = {
  Bronze: {
    rarity: "Bronze",
    min: 60,
    max: 74,
    label: "Bronze",
    ring: "ring-amber-700/60",
    glow: "shadow-[0_0_30px_-8px_rgba(180,83,9,0.6)]",
    grad: "from-amber-800/40 via-amber-950/30 to-black/40",
    text: "text-amber-500",
    chip: "bg-amber-700/30 text-amber-300",
  },
  Silver: {
    rarity: "Silver",
    min: 75,
    max: 84,
    label: "Silver",
    ring: "ring-slate-300/60",
    glow: "shadow-[0_0_30px_-8px_rgba(203,213,225,0.6)]",
    grad: "from-slate-400/30 via-slate-700/30 to-black/40",
    text: "text-slate-200",
    chip: "bg-slate-300/20 text-slate-100",
  },
  Gold: {
    rarity: "Gold",
    min: 85,
    max: 92,
    label: "Gold",
    ring: "ring-yellow-400/70",
    glow: "shadow-[0_0_36px_-6px_rgba(250,204,21,0.7)]",
    grad: "from-yellow-500/40 via-amber-700/30 to-black/40",
    text: "text-yellow-300",
    chip: "bg-yellow-400/25 text-yellow-200",
  },
  Diamond: {
    rarity: "Diamond",
    min: 93,
    max: 97,
    label: "Diamond",
    ring: "ring-cyan-300/80",
    glow: "shadow-[0_0_44px_-6px_rgba(103,232,249,0.85)]",
    grad: "from-cyan-400/40 via-sky-600/30 to-black/40",
    text: "text-cyan-200",
    chip: "bg-cyan-300/25 text-cyan-100",
  },
  Dynasty: {
    rarity: "Dynasty",
    min: 98,
    max: 99,
    label: "Dynasty",
    ring: "ring-fuchsia-400/80",
    glow: "shadow-[0_0_60px_-4px_rgba(232,121,249,0.95)]",
    grad: "from-fuchsia-500/50 via-purple-700/40 to-black/50",
    text: "text-fuchsia-200",
    chip: "bg-fuchsia-400/25 text-fuchsia-100",
  },
};

export interface Card {
  id: string;
  name: string;
  position: SoccerPosition;
  overall: number;
  rarity: Rarity;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  era?: string;
  country?: string;
  team?: string; // team abbr for team-affiliated commons (Starter Pack)
  generated?: boolean;
  moment?: boolean; // limited-time Moments card
  momentTitle?: string; // e.g. "Hand of God"
  upgradeLevel?: number; // applied by player upgrades for display
  espnPlayerId?: number; // ESPN player id for a real headshot (legends/moments)
  wikipediaImageUrl?: string; // cached Wikipedia headshot, used when no espnPlayerId
}

/** Apply a player-upgrade level to a card: small stat + overall bumps. */
export function applyUpgrade(card: Card, level: number): Card {
  if (!level || level <= 0) return card;
  const stat = level; // +1 per level
  const ovrBoost = Math.floor(level / 2); // +1 every two levels (caps modest)
  const cap = (n: number) => Math.min(99, n);
  return {
    ...card,
    pace: cap(card.pace + stat),
    shooting: cap(card.shooting + stat),
    passing: cap(card.passing + stat),
    defending: cap(card.defending + stat),
    overall: cap(card.overall + ovrBoost),
    upgradeLevel: level,
  };
}

export function rarityFor(overall: number): Rarity {
  if (overall >= 98) return "Dynasty";
  if (overall >= 93) return "Diamond";
  if (overall >= 85) return "Gold";
  if (overall >= 75) return "Silver";
  return "Bronze";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

// position tilts so generated cards have a believable stat shape
const POS_PACE: Record<SoccerPosition, number> = { GK: -28, DEF: 0, MID: 2, FWD: 8 };
const POS_SHOOT: Record<SoccerPosition, number> = { GK: -55, DEF: -18, MID: 2, FWD: 12 };
const POS_PASS: Record<SoccerPosition, number> = { GK: -14, DEF: -2, MID: 10, FWD: 0 };
const POS_DEF: Record<SoccerPosition, number> = { GK: 6, DEF: 12, MID: 0, FWD: -22 };

/** Shape Pace / Shooting / Passing / Defending from overall + position with
 *  stable jitter (used for generated commons that have no real stats). */
function deriveStats(
  overall: number,
  position: SoccerPosition,
  seed: number
): { pace: number; shooting: number; passing: number; defending: number } {
  const r = mulberry32(seed);
  const j = () => (r() - 0.5) * 6; // ±3 stable jitter
  // GK "defending" stands in for keeping; keep it strong and the rest low.
  return {
    pace: clamp(overall + POS_PACE[position] + j(), 40, 99),
    shooting: clamp(overall + POS_SHOOT[position] + j(), 20, 99),
    passing: clamp(overall + POS_PASS[position] + j(), 40, 99),
    defending: clamp(overall + POS_DEF[position] + j(), 30, 99),
  };
}

function legendToCard(p: SoccerPlayer): Card {
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    overall: p.overall,
    rarity: rarityFor(p.overall),
    pace: p.pace,
    shooting: p.shooting,
    passing: p.passing,
    defending: p.defending,
    era: p.era,
    country: p.country,
    espnPlayerId: p.espnPlayerId,
    wikipediaImageUrl: WIKIPEDIA_IMAGES[p.id],
  };
}

/* ---------------- generated commons (Bronze / Silver) ---------------- */
const FIRST = [
  "Lucas", "Mateo", "Diego", "Bruno", "Andre", "Marco", "Felix", "Nico",
  "Hugo", "Pablo", "Karim", "Yusuf", "Sergio", "Ivan", "Tariq", "Dejan",
  "Emre", "Joao", "Rafael", "Stefan", "Adama", "Mamadou", "Kenji", "Liam",
];
const LAST = [
  "Da Silva", "Fernandez", "Moreau", "Bianchi", "Schmidt", "Vargas", "Novak",
  "Andersson", "Okafor", "Tanaka", "Kovac", "Mensah", "Lindqvist", "Romero",
  "Petrov", "Haaland", "Diallo", "Costa", "Marchetti", "Toure", "Vidic",
  "Sorensen", "Nakamura", "Bah",
];
const POSITIONS: SoccerPosition[] = ["GK", "DEF", "MID", "FWD"];

function buildGenerated(): Card[] {
  const r = mulberry32(seedFromString("dynasty:soccer:myteam:commons:v1"));
  const cards: Card[] = [];
  const used = new Set<string>();
  const COUNT = 60; // plenty of commons so packs lean low-tier
  let n = 0;
  while (cards.length < COUNT && n < COUNT * 6) {
    n++;
    const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    if (used.has(name)) continue;
    used.add(name);
    // weight toward outfield positions
    const position = r() < 0.12 ? "GK" : POSITIONS[1 + Math.floor(r() * 3)];
    // ~65% bronze, ~35% silver
    const overall = r() < 0.65 ? 60 + Math.floor(r() * 15) : 75 + Math.floor(r() * 10);
    const id = `gen-${cards.length}`;
    const stats = deriveStats(overall, position, seedFromString(id));
    cards.push({
      id,
      name,
      position,
      overall,
      rarity: rarityFor(overall),
      generated: true,
      ...stats,
    });
  }
  return cards;
}

// Each starter-pack side gets a small Bronze/Silver roster — the building blocks
// granted by the new-user Starter Pack. Stable ids (`tm-<ABBR>-<n>`) so
// collections and lineups keep resolving across reloads.
function buildTeamCommons(): Card[] {
  const out: Card[] = [];
  const positionRota: SoccerPosition[] = ["GK", "DEF", "DEF", "MID", "MID", "FWD"];
  const overalls = [76, 80, 70, 78, 72, 74]; // mix of Silver + Bronze
  for (const team of TEAMS) {
    const r = mulberry32(seedFromString(`dynasty:soccer:team:${team.abbr}`));
    for (let i = 0; i < positionRota.length; i++) {
      const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
      const position = positionRota[i];
      const overall = overalls[i];
      const id = `tm-${team.abbr}-${i}`;
      const stats = deriveStats(overall, position, seedFromString(id));
      out.push({
        id,
        name,
        position,
        overall,
        rarity: rarityFor(overall),
        team: team.abbr,
        generated: true,
        ...stats,
      });
    }
  }
  return out;
}

const TEAM_COMMONS = buildTeamCommons();

// Limited-time "Moments" cards — boosted ratings tied to historic performances.
// They live in the pool so owned copies always resolve; availability windows +
// scheduling live in lib/soccer-myteam/moments.ts.
interface MomentDef {
  id: string;
  name: string;
  position: SoccerPosition;
  overall: number;
  era: string;
  country: string;
  title: string;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  espnPlayerId?: number;
}
const MOMENT_DEFS: MomentDef[] = [
  { id: "mom-maradona-86", name: "Diego Maradona", position: "FWD", overall: 99, era: "1986", country: "Argentina", title: "Goal of the Century", pace: 92, shooting: 93, passing: 96, defending: 40 },
  { id: "mom-messi-2022", name: "Lionel Messi", position: "FWD", overall: 99, era: "2022", country: "Argentina", title: "World Cup Glory", pace: 88, shooting: 95, passing: 97, defending: 40, espnPlayerId: 45843 },
  { id: "mom-zidane-2002", name: "Zinedine Zidane", position: "MID", overall: 98, era: "2002", country: "France", title: "Glasgow Volley", pace: 80, shooting: 92, passing: 97, defending: 66 },
  { id: "mom-r9-2002", name: "Ronaldo Nazario", position: "FWD", overall: 97, era: "2002", country: "Brazil", title: "World Cup Redemption", pace: 96, shooting: 96, passing: 82, defending: 30 },
  { id: "mom-iniesta-2010", name: "Andres Iniesta", position: "MID", overall: 96, era: "2010", country: "Spain", title: "The 116th Minute", pace: 78, shooting: 86, passing: 96, defending: 64 },
  { id: "mom-cr7-2018", name: "Cristiano Ronaldo", position: "FWD", overall: 97, era: "2018", country: "Portugal", title: "Bicycle Kick", pace: 90, shooting: 97, passing: 82, defending: 36 },
];

function buildMomentCards(): Card[] {
  return MOMENT_DEFS.map((m) => ({
    id: m.id,
    name: m.name,
    position: m.position,
    overall: m.overall,
    rarity: rarityFor(m.overall),
    era: m.era,
    country: m.country,
    moment: true,
    momentTitle: m.title,
    espnPlayerId: m.espnPlayerId,
    wikipediaImageUrl: WIKIPEDIA_IMAGES[slugId(m.name)],
    pace: m.pace,
    shooting: m.shooting,
    passing: m.passing,
    defending: m.defending,
  }));
}

export const MOMENT_CARDS: Card[] = buildMomentCards();

export const CARD_POOL: Card[] = [
  ...SOCCER_MASTER.map(legendToCard),
  ...buildGenerated(),
  ...TEAM_COMMONS,
  ...MOMENT_CARDS,
];

/** The Bronze/Silver cards affiliated with a given team (its Starter Pack).
 *  Accepts either a team id ("brazil") or abbr ("BRA"). */
export function starterPackForTeam(teamIdOrAbbr: string): Card[] {
  const team = TEAMS.find((t) => t.id === teamIdOrAbbr || t.abbr === teamIdOrAbbr);
  const abbr = team?.abbr ?? teamIdOrAbbr;
  return TEAM_COMMONS.filter((c) => c.team === abbr);
}

/** Safe rarity-tier lookup with a Bronze fallback for malformed/missing cards. */
export function tierForCard(card?: Card | null): RarityTier {
  if (!card || !RARITY_TIERS[card.rarity]) return RARITY_TIERS.Bronze;
  return RARITY_TIERS[card.rarity];
}

const BY_ID = new Map(CARD_POOL.map((c) => [c.id, c]));

export function cardById(id: string): Card | undefined {
  return BY_ID.get(id);
}

// Moments are excluded from the normal draw pool — they're only obtainable
// during their limited-time window (see lib/soccer-myteam/moments.ts).
export const CARDS_BY_RARITY: Record<Rarity, Card[]> = RARITY_ORDER.reduce((acc, rar) => {
  acc[rar] = CARD_POOL.filter((c) => c.rarity === rar && !c.moment);
  return acc;
}, {} as Record<Rarity, Card[]>);

/** Coin value of a card if sold back to the game (also a floor for auctions). */
export function quickSellValue(rarity: Rarity): number {
  return { Bronze: 25, Silver: 75, Gold: 250, Diamond: 800, Dynasty: 2500 }[rarity];
}
