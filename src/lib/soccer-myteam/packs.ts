// Soccer MyTeam — pack definitions and the weighted pull engine. Higher tiers
// cost more and shift the odds toward rare cards; a `guarantee` floor ensures
// the premium packs always deliver at least one card of that rarity or better.
import {
  Card,
  Rarity,
  RARITY_ORDER,
  CARDS_BY_RARITY,
} from "@/lib/soccer-myteam/cards";

export interface PackDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  size: number;
  blurb: string;
  accent: string;
  weights: Partial<Record<Rarity, number>>;
  guarantee?: Rarity;
}

export const PACKS: PackDef[] = [
  {
    id: "pro",
    name: "Pro Pack",
    emoji: "📦",
    price: 250,
    size: 3,
    blurb: "Three cards. Mostly squad players — but a star can slip in.",
    accent: "text-amber-400",
    weights: { Bronze: 58, Silver: 30, Gold: 11, Diamond: 1 },
  },
  {
    id: "elite",
    name: "Elite Pack",
    emoji: "🎁",
    price: 800,
    size: 5,
    blurb: "Five cards with a guaranteed Gold or better.",
    accent: "text-yellow-300",
    weights: { Bronze: 25, Silver: 35, Gold: 33, Diamond: 6, Dynasty: 1 },
    guarantee: "Gold",
  },
  {
    id: "dynasty",
    name: "Icon Pack",
    emoji: "💎",
    price: 2500,
    size: 5,
    blurb: "Five cards, a guaranteed Diamond, and the best shot at an Icon.",
    accent: "text-fuchsia-300",
    weights: { Silver: 18, Gold: 45, Diamond: 30, Dynasty: 7 },
    guarantee: "Diamond",
  },
];

export function packById(id: string): PackDef | undefined {
  return PACKS.find((p) => p.id === id);
}

function rollRarity(weights: Partial<Record<Rarity, number>>, rng: () => number): Rarity {
  const entries = RARITY_ORDER.filter((r) => (weights[r] ?? 0) > 0).map(
    (r) => [r, weights[r] as number] as const
  );
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let t = rng() * total;
  for (const [r, w] of entries) {
    t -= w;
    if (t <= 0) return r;
  }
  return entries[entries.length - 1][0];
}

/** Draw a random card of the given rarity, stepping down a tier if a rarity
 *  somehow has no members (keeps the engine safe against empty pools). */
function drawCard(rarity: Rarity, rng: () => number): Card {
  let idx = RARITY_ORDER.indexOf(rarity);
  while (idx >= 0) {
    const pool = CARDS_BY_RARITY[RARITY_ORDER[idx]];
    if (pool.length) return pool[Math.floor(rng() * pool.length)];
    idx--;
  }
  for (const r of RARITY_ORDER) if (CARDS_BY_RARITY[r].length) return CARDS_BY_RARITY[r][0];
  throw new Error("No cards available");
}

const PULL_WEIGHTS: Record<Rarity, number> = {
  Bronze: 40,
  Silver: 30,
  Gold: 22,
  Diamond: 7,
  Dynasty: 1,
};

/** Draw one card with at least `minRarity`, weighted toward the floor tier. */
export function drawAtLeast(minRarity: Rarity, rng: () => number = Math.random): Card {
  const floor = RARITY_ORDER.indexOf(minRarity);
  const weights: Partial<Record<Rarity, number>> = {};
  for (const r of RARITY_ORDER.slice(floor)) weights[r] = PULL_WEIGHTS[r];
  return drawCard(rollRarity(weights, rng), rng);
}

export function openPack(pack: PackDef, rng: () => number = Math.random): Card[] {
  const cards: Card[] = [];
  const floorIdx = pack.guarantee ? RARITY_ORDER.indexOf(pack.guarantee) : -1;

  for (let i = 0; i < pack.size; i++) {
    const isLast = i === pack.size - 1;
    const needGuarantee =
      floorIdx >= 0 &&
      isLast &&
      !cards.some((c) => RARITY_ORDER.indexOf(c.rarity) >= floorIdx);

    let rarity: Rarity;
    if (needGuarantee) {
      const restricted: Partial<Record<Rarity, number>> = {};
      for (const r of RARITY_ORDER.slice(floorIdx))
        restricted[r] = pack.weights[r] ?? (r === pack.guarantee ? 1 : 0.2);
      rarity = rollRarity(restricted, rng);
    } else {
      rarity = rollRarity(pack.weights, rng);
    }
    cards.push(drawCard(rarity, rng));
  }
  return cards;
}
