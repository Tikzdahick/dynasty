// MyTeam — player card model. The 58 all-time legends become the Gold/Diamond/
// Dynasty chase cards; a deterministic pool of "rotation" players fills the
// Bronze/Silver commons so the pack economy feels like Ultimate Team (most
// pulls common, top tiers rare). Everything here is stable across reloads so a
// stored card id always resolves to the same card.
import { NbaPlayer, NbaPosition } from "@/types";
import { NBA_PLAYERS } from "@/lib/nba/players";
import { mulberry32, seedFromString } from "@/lib/rng";
import { TEAMS } from "@/lib/myteam/teams";

export type Rarity = "Bronze" | "Silver" | "Gold" | "Diamond" | "Dynasty";

export const RARITY_ORDER: Rarity[] = ["Bronze", "Silver", "Gold", "Diamond", "Dynasty"];

export interface RarityTier {
  rarity: Rarity;
  min: number;
  max: number;
  label: string;
  // tailwind tokens for the card frame / glow
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

/** Apply a player-upgrade level to a card: small stat + overall bumps. */
export function applyUpgrade(card: Card, level: number): Card {
  if (!level || level <= 0) return card;
  const stat = level; // +1 per level
  const ovrBoost = Math.floor(level / 2); // +1 every two levels (caps modest)
  const cap = (n: number) => Math.min(99, n);
  return {
    ...card,
    speed: cap(card.speed + stat),
    shooting: cap(card.shooting + stat),
    defense: cap(card.defense + stat),
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

export interface Card {
  id: string;
  name: string;
  position: NbaPosition;
  overall: number;
  rarity: Rarity;
  speed: number;
  shooting: number;
  defense: number;
  era?: string;
  team?: string; // team abbr for team-affiliated commons (Starter Pack)
  generated?: boolean;
  moment?: boolean; // limited-time Moments card
  momentTitle?: string; // e.g. "81-Point Game"
  upgradeLevel?: number; // applied by player upgrades for display
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

// position tilts so cards have a believable stat shape
const POS_SPEED: Record<NbaPosition, number> = { PG: 14, SG: 10, SF: 4, PF: -2, C: -8 };
const POS_SHOOT: Record<NbaPosition, number> = { PG: 6, SG: 10, SF: 6, PF: -2, C: -6 };
const POS_DEF: Record<NbaPosition, number> = { PG: -4, SG: 0, SF: 4, PF: 10, C: 14 };

/** Derive Speed / Shooting / Defense. Uses real box-score stats when present
 *  (legends), otherwise shapes them from overall + position with stable jitter. */
function deriveStats(
  overall: number,
  position: NbaPosition,
  seed: number,
  box?: { ppg: number; rpg: number; apg: number }
): { speed: number; shooting: number; defense: number } {
  const r = mulberry32(seed);
  const j = () => (r() - 0.5) * 6; // ±3 stable jitter
  if (box) {
    return {
      shooting: clamp(overall * 0.55 + box.ppg * 1.7 + POS_SHOOT[position] + j(), 50, 99),
      speed: clamp(overall * 0.78 + box.apg * 0.9 + POS_SPEED[position] + j(), 50, 99),
      defense: clamp(overall * 0.6 + box.rpg * 1.7 + POS_DEF[position] + j(), 50, 99),
    };
  }
  return {
    shooting: clamp(overall + POS_SHOOT[position] + j(), 40, 99),
    speed: clamp(overall + POS_SPEED[position] + j(), 40, 99),
    defense: clamp(overall + POS_DEF[position] + j(), 40, 99),
  };
}

function legendToCard(p: NbaPlayer): Card {
  const stats = deriveStats(p.overall, p.position, seedFromString(p.id), {
    ppg: p.ppg,
    rpg: p.rpg,
    apg: p.apg,
  });
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    overall: p.overall,
    rarity: rarityFor(p.overall),
    era: p.era,
    ...stats,
  };
}

/* ---------------- generated commons (Bronze / Silver) ---------------- */
const FIRST = [
  "Marcus", "Tyrese", "Jalen", "Cam", "Devin", "Malik", "Isaiah", "Trey", "Quentin",
  "Darius", "Brandon", "Cole", "Jaylen", "Kobe", "Amari", "Deandre", "Terrence",
  "Jordan", "Xavier", "Elijah", "Bryce", "Khris", "Damon", "Rashad", "Vince",
];
const LAST = [
  "Whitfield", "Banks", "Castillo", "Okafor", "Reyes", "Holloway", "Sorensen",
  "Mbeki", "Petrov", "Calloway", "Underwood", "Vasquez", "Brooks", "Nakamura",
  "Donnelly", "Achebe", "Larsson", "Mendez", "Carrington", "Volkov", "Hayes",
  "Sutton", "Granger", "Okonkwo", "Ferreira",
];
const POSITIONS: NbaPosition[] = ["PG", "SG", "SF", "PF", "C"];

function buildGenerated(): Card[] {
  const r = mulberry32(seedFromString("dynasty:myteam:commons:v1"));
  const cards: Card[] = [];
  const used = new Set<string>();
  const COUNT = 60; // plenty of commons so packs lean low-tier
  let n = 0;
  while (cards.length < COUNT && n < COUNT * 6) {
    n++;
    const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    if (used.has(name)) continue;
    used.add(name);
    const position = POSITIONS[Math.floor(r() * POSITIONS.length)];
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

// Each NBA team gets a small Bronze/Silver roster — the building blocks granted
// by the new-user Starter Pack. Stable ids (`tm-<ABBR>-<n>`) so collections and
// lineups keep resolving across reloads.
function buildTeamCommons(): Card[] {
  const out: Card[] = [];
  const positionRota: NbaPosition[] = ["PG", "SG", "SF", "PF", "C", "SF"];
  const overalls = [80, 76, 72, 70, 74, 67]; // mix of Silver + Bronze
  for (const team of TEAMS) {
    const r = mulberry32(seedFromString(`dynasty:team:${team.abbr}`));
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
// scheduling live in lib/myteam/moments.ts.
interface MomentDef {
  id: string;
  name: string;
  position: NbaPosition;
  overall: number;
  era: string;
  title: string;
}
const MOMENT_DEFS: MomentDef[] = [
  { id: "mom-kobe81", name: "Kobe Bryant", position: "SG", overall: 97, era: "2006", title: "81-Point Game" },
  { id: "mom-lebron-fmvp", name: "LeBron James", position: "SF", overall: 99, era: "2016", title: "Finals MVP" },
  { id: "mom-mj-flu", name: "Michael Jordan", position: "SG", overall: 99, era: "1997", title: "The Flu Game" },
  { id: "mom-curry-msg", name: "Stephen Curry", position: "PG", overall: 97, era: "2021", title: "54 at the Garden" },
  { id: "mom-giannis-50", name: "Giannis Antetokounmpo", position: "PF", overall: 98, era: "2021", title: "Title-Clincher 50" },
  { id: "mom-dirk-2011", name: "Dirk Nowitzki", position: "PF", overall: 96, era: "2011", title: "2011 Title Run" },
];

function buildMomentCards(): Card[] {
  return MOMENT_DEFS.map((m) => {
    const stats = deriveStats(m.overall, m.position, seedFromString(m.id));
    return {
      id: m.id,
      name: m.name,
      position: m.position,
      overall: m.overall,
      rarity: rarityFor(m.overall),
      era: m.era,
      moment: true,
      momentTitle: m.title,
      ...stats,
    };
  });
}

export const MOMENT_CARDS: Card[] = buildMomentCards();

export const CARD_POOL: Card[] = [
  ...NBA_PLAYERS.map(legendToCard),
  ...buildGenerated(),
  ...TEAM_COMMONS,
  ...MOMENT_CARDS,
];

/** The Bronze/Silver cards affiliated with a given team (its Starter Pack).
 *  Accepts either a team id ("lakers") or abbr ("LAL") so callers can't pass
 *  the wrong identifier and get an empty pack. */
export function starterPackForTeam(teamIdOrAbbr: string): Card[] {
  const team = TEAMS.find(
    (t) => t.id === teamIdOrAbbr || t.abbr === teamIdOrAbbr
  );
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
// during their limited-time window (see lib/myteam/moments.ts).
export const CARDS_BY_RARITY: Record<Rarity, Card[]> = RARITY_ORDER.reduce((acc, rar) => {
  acc[rar] = CARD_POOL.filter((c) => c.rarity === rar && !c.moment);
  return acc;
}, {} as Record<Rarity, Card[]>);

/** Coin value of a card if sold back to the game (also a floor for auctions). */
export function quickSellValue(rarity: Rarity): number {
  return { Bronze: 25, Silver: 75, Gold: 250, Diamond: 800, Dynasty: 2500 }[rarity];
}
