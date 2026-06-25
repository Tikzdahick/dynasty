// Player upgrades — spend coins to raise a Bronze/Silver card's stats a little.
// Stored per card id (all copies share the upgrade level). Effective stats are
// resolved via applyUpgrade so upgrades show everywhere the card appears.
import { Card, cardById, applyUpgrade } from "@/lib/myteam/cards";

const KEY = "dynasty.upgrades";

export const MAX_LEVEL = 4;

function read(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}
function write(map: Record<string, number>) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(map));
}

export function getLevel(cardId: string): number {
  return read()[cardId] ?? 0;
}

/** Only Bronze/Silver cards can be upgraded. */
export function isUpgradeable(card: Card): boolean {
  return card.rarity === "Bronze" || card.rarity === "Silver";
}

export function upgradeCost(card: Card, level = getLevel(card.id)): number {
  const base = card.rarity === "Bronze" ? 200 : 400;
  return base * (level + 1); // gets pricier each level
}

export function canUpgrade(card: Card): boolean {
  return isUpgradeable(card) && getLevel(card.id) < MAX_LEVEL;
}

/** Bump a card's upgrade level by one (caller handles coin spend). */
export function bumpLevel(cardId: string): number {
  const map = read();
  const next = Math.min(MAX_LEVEL, (map[cardId] ?? 0) + 1);
  map[cardId] = next;
  write(map);
  return next;
}

/** Resolve a card id to its upgraded ("effective") form for display + ratings. */
export function resolveCard(cardId: string): Card | undefined {
  const base = cardById(cardId);
  if (!base) return undefined;
  return applyUpgrade(base, getLevel(cardId));
}
