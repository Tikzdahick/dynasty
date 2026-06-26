"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/lib/soccer-myteam/cards";
import { PackOpening } from "@/components/soccer-myteam/PackOpening";
import {
  SEASON_TIERS,
  MAX_SEASON_XP,
  getXp,
  currentTier,
  claimableTiers,
  getClaimedTiers,
  claimTier,
  weeksRemaining,
} from "@/lib/soccer-myteam/seasonPass";

export default function SeasonPassPage() {
  const [xp, setXp] = useState(0);
  const [claimed, setClaimed] = useState<number[]>([]);
  const [reveal, setReveal] = useState<Card[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => {
    setXp(getXp());
    setClaimed(getClaimedTiers());
  };
  useEffect(refresh, []);

  const tier = currentTier(xp);
  const claimable = useMemo(() => new Set(claimableTiers(xp)), [xp, claimed]);
  const nextTier = SEASON_TIERS.find((t) => t.xp > xp);
  const prevXp = SEASON_TIERS.filter((t) => t.xp <= xp).slice(-1)[0]?.xp ?? 0;
  const progPct = nextTier
    ? Math.round(((xp - prevXp) / (nextTier.xp - prevXp)) * 100)
    : 100;

  const claim = (tierNum: number) => {
    const res = claimTier(tierNum);
    if (!res) return;
    if (res.cards.length) setReveal(res.cards);
    else {
      setToast(`+${res.coins.toLocaleString()} coins claimed!`);
      setTimeout(() => setToast(null), 2200);
    }
    refresh();
  };

  return (
    <div className="bg-grain">
      {reveal && <PackOpening cards={reveal} onDone={() => setReveal(null)} />}
      {toast && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-xl border border-emerald-300/40 bg-ink/95 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-5">
        <Link href="/soccer/myteam" className="text-sm text-white/40 hover:text-white">
          ← Soccer MyTeam
        </Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-3xl font-black">
          <span className="bg-gradient-to-r from-soccer via-emerald-300 to-fuchsia-400 bg-clip-text text-transparent">
            Season Pass
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/60">
            {weeksRemaining()} weeks left
          </span>
        </h1>
        <p className="text-sm text-white/50">
          Earn XP from matches, packs, and challenges to unlock the track.
        </p>
      </div>

      {/* XP summary */}
      <div className="card mb-6 p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Tier</div>
            <div className="text-3xl font-black text-emerald-300">{tier}/12</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Total XP</div>
            <div className="text-xl font-black tabular-nums">{xp.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-fuchsia-400"
            initial={{ width: 0 }}
            animate={{ width: `${progPct}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[11px] text-white/40">
          {nextTier
            ? `${(nextTier.xp - xp).toLocaleString()} XP to Tier ${nextTier.tier}`
            : `Max tier reached — ${MAX_SEASON_XP.toLocaleString()} XP`}
        </div>
      </div>

      {/* reward track */}
      <h2 className="mb-3 text-lg font-bold">Reward Track</h2>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {SEASON_TIERS.map((t) => {
          const isClaimed = claimed.includes(t.tier);
          const isClaimable = claimable.has(t.tier);
          const reached = xp >= t.xp;
          return (
            <motion.button
              key={t.tier}
              whileTap={isClaimable ? { scale: 0.96 } : {}}
              onClick={() => isClaimable && claim(t.tier)}
              className={`relative flex w-28 shrink-0 flex-col items-center rounded-2xl border p-3 text-center transition ${
                isClaimable
                  ? "border-emerald-300 bg-emerald-400/15 shadow-[0_0_26px_-6px_rgba(52,211,153,0.7)]"
                  : isClaimed
                  ? "border-emerald-400/30 bg-emerald-400/5"
                  : t.exclusive
                  ? "border-fuchsia-400/40 bg-fuchsia-500/10"
                  : "border-white/10 bg-panel/50"
              } ${!reached ? "opacity-60" : ""}`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                Tier {t.tier}
              </div>
              <div className="my-1 text-3xl">{isClaimed ? "✅" : t.reward.emoji}</div>
              <div className="text-[11px] font-semibold leading-tight">{t.reward.label}</div>
              {t.exclusive && !isClaimed && (
                <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-fuchsia-300">
                  Exclusive
                </div>
              )}
              <div className="mt-1 text-[10px] text-white/40">{t.xp.toLocaleString()} XP</div>
              {isClaimable && (
                <span className="absolute -top-2 rounded-full bg-emerald-400 px-2 text-[9px] font-black text-black">
                  CLAIM
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
