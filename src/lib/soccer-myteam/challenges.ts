// Soccer Daily & Weekly Challenges. Daily set rotates every 24h, weekly every
// 7 days; both are picked deterministically from pools by date so they're stable
// within the period. Progress is driven by event metrics (see events.ts) and
// claims pay out via the shared reward + XP systems.
import { Reward, grantReward, GrantResult } from "@/lib/soccer-myteam/rewards";
import { addXp } from "@/lib/soccer-myteam/seasonPass";
import { mulberry32, seedFromString } from "@/lib/rng";

export type Metric =
  | "gamesPlayed"
  | "gamesWon"
  | "packsOpened"
  | "cardsUpgraded"
  | "auctionSold"
  | "rivalsBeaten";

export interface ChallengeDef {
  id: string;
  desc: string;
  metric: Metric;
  goal: number;
  xp: number;
  reward: Reward;
}

const DAILY_POOL: ChallengeDef[] = [
  { id: "d_win2", desc: "Win 2 matches", metric: "gamesWon", goal: 2, xp: 60, reward: { kind: "coins", amount: 200, emoji: "🪙", label: "200 Coins" } },
  { id: "d_play3", desc: "Play 3 matches", metric: "gamesPlayed", goal: 3, xp: 50, reward: { kind: "coins", amount: 150, emoji: "🪙", label: "150 Coins" } },
  { id: "d_pack1", desc: "Open a pack", metric: "packsOpened", goal: 1, xp: 40, reward: { kind: "coins", amount: 150, emoji: "🪙", label: "150 Coins" } },
  { id: "d_rival1", desc: "Beat a rival", metric: "rivalsBeaten", goal: 1, xp: 70, reward: { kind: "coins", amount: 250, emoji: "🪙", label: "250 Coins" } },
  { id: "d_upgrade1", desc: "Upgrade a card", metric: "cardsUpgraded", goal: 1, xp: 40, reward: { kind: "coins", amount: 150, emoji: "🪙", label: "150 Coins" } },
];

const WEEKLY_POOL: ChallengeDef[] = [
  { id: "w_win10", desc: "Win 10 matches this week", metric: "gamesWon", goal: 10, xp: 250, reward: { kind: "card", minRarity: "Gold", emoji: "⭐", label: "Gold+ Card" } },
  { id: "w_rivals5", desc: "Beat 5 rivals this week", metric: "rivalsBeaten", goal: 5, xp: 250, reward: { kind: "card", minRarity: "Gold", emoji: "⭐", label: "Gold+ Card" } },
  { id: "w_packs5", desc: "Open 5 packs this week", metric: "packsOpened", goal: 5, xp: 200, reward: { kind: "pack", packId: "elite", emoji: "🎁", label: "Elite Pack" } },
  { id: "w_sell3", desc: "Sell 3 cards on the auction house", metric: "auctionSold", goal: 3, xp: 200, reward: { kind: "coins", amount: 1000, emoji: "🪙", label: "1,000 Coins" } },
];

function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function weekKey(d = new Date()): string {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86_400_000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function pick(pool: ChallengeDef[], seedStr: string, n: number): ChallengeDef[] {
  const rng = mulberry32(seedFromString(seedStr));
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}

export function activeDailyDefs(): ChallengeDef[] {
  return pick(DAILY_POOL, `sc:daily:${dayKey()}`, 3);
}
export function activeWeeklyDefs(): ChallengeDef[] {
  return pick(WEEKLY_POOL, `sc:weekly:${weekKey()}`, 2);
}

interface Period {
  key: string;
  prog: Record<string, number>;
  claimed: string[];
}
function readPeriod(storageKey: string, currentKey: string): Period {
  if (typeof window === "undefined") return { key: currentKey, prog: {}, claimed: [] };
  try {
    const p = JSON.parse(localStorage.getItem(storageKey) || "") as Period;
    if (p.key === currentKey) return p;
  } catch {
    /* fall through to reset */
  }
  return { key: currentKey, prog: {}, claimed: [] };
}
function writePeriod(storageKey: string, p: Period) {
  if (typeof window !== "undefined") localStorage.setItem(storageKey, JSON.stringify(p));
}

const DAILY_KEY = "dynasty.sc.challenges.daily";
const WEEKLY_KEY = "dynasty.sc.challenges.weekly";

export function trackMetric(metric: Metric, amount = 1) {
  if (typeof window === "undefined") return;
  const daily = readPeriod(DAILY_KEY, dayKey());
  for (const def of activeDailyDefs())
    if (def.metric === metric)
      daily.prog[def.id] = Math.min(def.goal, (daily.prog[def.id] ?? 0) + amount);
  writePeriod(DAILY_KEY, daily);

  const weekly = readPeriod(WEEKLY_KEY, weekKey());
  for (const def of activeWeeklyDefs())
    if (def.metric === metric)
      weekly.prog[def.id] = Math.min(def.goal, (weekly.prog[def.id] ?? 0) + amount);
  writePeriod(WEEKLY_KEY, weekly);
}

export interface ChallengeState extends ChallengeDef {
  progress: number;
  complete: boolean;
  claimed: boolean;
  scope: "daily" | "weekly";
}

function statesFor(
  defs: ChallengeDef[],
  storageKey: string,
  currentKey: string,
  scope: "daily" | "weekly"
): ChallengeState[] {
  const period = readPeriod(storageKey, currentKey);
  return defs.map((def) => {
    const progress = period.prog[def.id] ?? 0;
    return {
      ...def,
      progress,
      complete: progress >= def.goal,
      claimed: period.claimed.includes(def.id),
      scope,
    };
  });
}

export function getChallenges(): { daily: ChallengeState[]; weekly: ChallengeState[] } {
  return {
    daily: statesFor(activeDailyDefs(), DAILY_KEY, dayKey(), "daily"),
    weekly: statesFor(activeWeeklyDefs(), WEEKLY_KEY, weekKey(), "weekly"),
  };
}

export function claimChallenge(id: string, scope: "daily" | "weekly"): GrantResult | null {
  const defs = scope === "daily" ? activeDailyDefs() : activeWeeklyDefs();
  const def = defs.find((d) => d.id === id);
  if (!def) return null;
  const storageKey = scope === "daily" ? DAILY_KEY : WEEKLY_KEY;
  const period = readPeriod(storageKey, scope === "daily" ? dayKey() : weekKey());
  if ((period.prog[id] ?? 0) < def.goal || period.claimed.includes(id)) return null;
  const res = grantReward(def.reward);
  addXp(def.xp);
  period.claimed.push(id);
  writePeriod(storageKey, period);
  return res;
}

export function claimableCount(): number {
  const { daily, weekly } = getChallenges();
  return [...daily, ...weekly].filter((c) => c.complete && !c.claimed).length;
}
