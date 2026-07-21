// Season Pass — a 6-week XP progression track. XP comes from playing games,
// opening packs, and completing challenges (see events.ts). Tiers unlock at XP
// thresholds and are claimed manually for coins / packs / exclusive cards.
import { Reward, grantReward, GrantResult } from "@/lib/myteam/rewards";
import { getCoins } from "@/lib/store/myteam";
import { cloudUserId, claimRewardServer } from "@/lib/store/cloud";

const XP_KEY = "dynasty.season.xp";
const CLAIMED_KEY = "dynasty.season.claimed";

export const SEASON_WEEKS = 6;
// fixed season window so "weeks remaining" is stable for everyone
export const SEASON_START = new Date("2026-06-22T00:00:00").getTime();
export const SEASON_END = SEASON_START + SEASON_WEEKS * 7 * 86_400_000;

export interface SeasonTier {
  tier: number; // 1-based
  xp: number; // cumulative XP needed
  reward: Reward;
  exclusive?: boolean;
}

export const SEASON_TIERS: SeasonTier[] = [
  { tier: 1, xp: 300, reward: { kind: "coins", amount: 250, emoji: "🪙", label: "250 Coins" } },
  { tier: 2, xp: 700, reward: { kind: "pack", packId: "pro", emoji: "📦", label: "Pro Pack" } },
  { tier: 3, xp: 1150, reward: { kind: "coins", amount: 500, emoji: "🪙", label: "500 Coins" } },
  { tier: 4, xp: 1650, reward: { kind: "card", minRarity: "Gold", emoji: "⭐", label: "Gold+ Card" } },
  { tier: 5, xp: 2200, reward: { kind: "coins", amount: 750, emoji: "🪙", label: "750 Coins" } },
  { tier: 6, xp: 2800, reward: { kind: "pack", packId: "elite", emoji: "🎁", label: "Elite Pack" } },
  { tier: 7, xp: 3450, reward: { kind: "coins", amount: 1000, emoji: "🪙", label: "1,000 Coins" } },
  { tier: 8, xp: 4150, reward: { kind: "card", minRarity: "Diamond", emoji: "💎", label: "Diamond+ Card", }, exclusive: true },
  { tier: 9, xp: 4900, reward: { kind: "coins", amount: 1500, emoji: "🪙", label: "1,500 Coins" } },
  { tier: 10, xp: 5700, reward: { kind: "pack", packId: "dynasty", emoji: "💎", label: "Dynasty Pack" } },
  { tier: 11, xp: 6600, reward: { kind: "coins", amount: 2000, emoji: "🪙", label: "2,000 Coins" } },
  { tier: 12, xp: 7600, reward: { kind: "card", minRarity: "Dynasty", emoji: "🐐", label: "Dynasty Legend", }, exclusive: true },
];

export const MAX_SEASON_XP = SEASON_TIERS[SEASON_TIERS.length - 1].xp;

export function getXp(): number {
  if (typeof window === "undefined") return 0;
  return Math.max(0, parseInt(localStorage.getItem(XP_KEY) || "0", 10) || 0);
}

export function addXp(amount: number): number {
  if (typeof window === "undefined") return 0;
  const xp = getXp() + Math.max(0, Math.round(amount));
  localStorage.setItem(XP_KEY, String(xp));
  return xp;
}

export function getClaimedTiers(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CLAIMED_KEY) || "[]") as number[];
  } catch {
    return [];
  }
}

/** Highest tier number whose XP threshold has been reached. */
export function currentTier(xp = getXp()): number {
  let t = 0;
  for (const tier of SEASON_TIERS) if (xp >= tier.xp) t = tier.tier;
  return t;
}

/** Tiers reached but not yet claimed. */
export function claimableTiers(xp = getXp()): number[] {
  const claimed = new Set(getClaimedTiers());
  return SEASON_TIERS.filter((t) => xp >= t.xp && !claimed.has(t.tier)).map((t) => t.tier);
}

export async function claimTier(tierNum: number): Promise<GrantResult | null> {
  const tier = SEASON_TIERS.find((t) => t.tier === tierNum);
  if (!tier || getXp() < tier.xp) return null;
  const claimed = getClaimedTiers();
  if (claimed.includes(tierNum)) return null;

  let res: GrantResult;
  if (tier.reward.kind === "coins" && cloudUserId()) {
    // one-time tier → server owns the amount + dedups (period "")
    const coins = await claimRewardServer("nba", "season", String(tierNum), "");
    if (coins == null) return null;
    res = { reward: tier.reward, coins, cards: [], newBalance: getCoins() };
  } else {
    res = grantReward(tier.reward);
  }
  claimed.push(tierNum);
  if (typeof window !== "undefined") localStorage.setItem(CLAIMED_KEY, JSON.stringify(claimed));
  return res;
}

export function weeksRemaining(): number {
  const ms = SEASON_END - Date.now();
  return Math.max(0, Math.ceil(ms / (7 * 86_400_000)));
}
