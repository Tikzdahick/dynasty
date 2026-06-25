// Achievement catalog + evaluators. Evaluators return the ids currently
// satisfied by a finished run; callers pass those to `unlock()` to persist and
// detect freshly-earned badges.
import { NbaSeasonResult, SoccerTournamentResult } from "@/types";
import { ChemLabel } from "@/lib/chemistry";
import { DraftMode } from "@/components/RoundDraft";

export interface Achievement {
  id: string;
  emoji: string;
  label: string;
  desc: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "perfect-season", emoji: "🐐", label: "Immortal", desc: "Go 82-0 in NBA mode." },
  { id: "historic-season", emoji: "🔥", label: "Historic", desc: "Win 70+ games in a season." },
  { id: "world-champion", emoji: "🏆", label: "World Champions", desc: "Win the Soccer trophy." },
  { id: "pen-hero", emoji: "🥅", label: "Ice in Veins", desc: "Win a knockout on penalties." },
  { id: "clean-machine", emoji: "🧤", label: "Clean Machine", desc: "Keep 3+ clean sheets in one run." },
  { id: "golden-boot", emoji: "👟", label: "Golden Boot", desc: "One player scores 5+ in a tournament." },
  { id: "chemist", emoji: "🧪", label: "Chemist", desc: "Field an Elite-chemistry roster." },
  { id: "iq-grad", emoji: "🧠", label: "Galaxy Brain", desc: "Finish a draft in IQ mode." },
  { id: "survivor", emoji: "🫥", label: "Ghost Buster", desc: "Win big despite drafting a decoy." },
  { id: "streak-3", emoji: "📅", label: "Habit Forming", desc: "Hit a 3-day daily streak." },
  { id: "streak-7", emoji: "⚡", label: "Unstoppable", desc: "Hit a 7-day daily streak." },
  { id: "collector", emoji: "📚", label: "Dynasty Builder", desc: "Save 10 results." },
];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

interface BaseCtx {
  mode: DraftMode;
  chem: ChemLabel | undefined;
  streak: number;
  savedCount: number;
  hadGhost: boolean;
}

function shared(ctx: BaseCtx): string[] {
  const ids: string[] = [];
  if (ctx.chem === "Elite") ids.push("chemist");
  if (ctx.mode === "iq") ids.push("iq-grad");
  if (ctx.streak >= 3) ids.push("streak-3");
  if (ctx.streak >= 7) ids.push("streak-7");
  if (ctx.savedCount >= 10) ids.push("collector");
  return ids;
}

export function evaluateNba(ctx: BaseCtx & { season: NbaSeasonResult }): string[] {
  const ids = shared(ctx);
  if (ctx.season.losses === 0) ids.push("perfect-season");
  if (ctx.season.wins >= 70) ids.push("historic-season");
  if (ctx.hadGhost && ctx.season.wins >= 60) ids.push("survivor");
  return ids;
}

export function evaluateSoccer(
  ctx: BaseCtx & { result: SoccerTournamentResult }
): string[] {
  const ids = shared(ctx);
  const { result } = ctx;
  if (result.champion) ids.push("world-champion");
  if (result.matches.some((m) => m.win && m.penalties)) ids.push("pen-hero");
  if (result.matches.filter((m) => m.oppGoals === 0).length >= 3) ids.push("clean-machine");

  const goals = new Map<string, number>();
  for (const m of result.matches)
    for (const s of m.scorers) goals.set(s.name, (goals.get(s.name) ?? 0) + 1);
  if ([...goals.values()].some((g) => g >= 5)) ids.push("golden-boot");

  if (ctx.hadGhost && result.champion) ids.push("survivor");
  return ids;
}
