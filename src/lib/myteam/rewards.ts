// MyTeam — the 7-day daily-reward ladder and the logic that materialises a
// reward into coins / cards. Rewards escalate across the cycle and reset to
// Day 1 after Day 7, while the login streak keeps climbing.
import { Card, Rarity } from "@/lib/myteam/cards";
import { openPack, packById, drawAtLeast } from "@/lib/myteam/packs";
import { addCoins, addOwned, getCoins } from "@/lib/store/myteam";
import { CYCLE_LENGTH } from "@/lib/store/dailyReward";
import { logPackOpen } from "@/lib/store/packHistory";

export type Reward =
  | { kind: "coins"; amount: number; emoji: string; label: string }
  | { kind: "pack"; packId: string; emoji: string; label: string }
  | { kind: "card"; minRarity: Rarity; emoji: string; label: string };

// Index 0 = Day 1 … index 6 = Day 7.
export const DAILY_REWARDS: Reward[] = [
  { kind: "coins", amount: 150, emoji: "🪙", label: "150 Coins" },
  { kind: "coins", amount: 250, emoji: "🪙", label: "250 Coins" },
  { kind: "pack", packId: "pro", emoji: "📦", label: "Pro Pack" },
  { kind: "coins", amount: 400, emoji: "🪙", label: "400 Coins" },
  { kind: "coins", amount: 600, emoji: "🪙", label: "600 Coins" },
  { kind: "coins", amount: 800, emoji: "🪙", label: "800 Coins" },
  { kind: "card", minRarity: "Gold", emoji: "⭐", label: "Gold+ Card" },
];

export function rewardForDay(day: number): Reward {
  const idx = ((day - 1) % CYCLE_LENGTH + CYCLE_LENGTH) % CYCLE_LENGTH;
  return DAILY_REWARDS[idx];
}

export interface GrantResult {
  reward: Reward;
  coins: number; // coins granted (0 if none)
  cards: Card[]; // cards granted (empty if none)
  newBalance: number;
}

/** Apply a reward to the local store. Call only after a successful claim. */
export function grantReward(reward: Reward, source = "Reward"): GrantResult {
  if (reward.kind === "coins") {
    const newBalance = addCoins(reward.amount);
    return { reward, coins: reward.amount, cards: [], newBalance };
  }

  if (reward.kind === "pack") {
    const pack = packById(reward.packId)!;
    const cards = openPack(pack);
    addOwned(cards.map((c) => c.id));
    logPackOpen(source, cards.map((c) => c.id));
    return { reward, coins: 0, cards, newBalance: getCoins() };
  }

  // single guaranteed card
  const card = drawAtLeast(reward.minRarity);
  addOwned([card.id]);
  logPackOpen(source, [card.id]);
  return { reward, coins: 0, cards: [card], newBalance: getCoins() };
}
