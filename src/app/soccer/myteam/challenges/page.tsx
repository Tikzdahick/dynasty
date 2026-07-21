"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/lib/soccer-myteam/cards";
import { PackOpening } from "@/components/soccer-myteam/PackOpening";
import {
  getChallenges,
  claimChallenge,
  ChallengeState,
} from "@/lib/soccer-myteam/challenges";

export default function ChallengesPage() {
  const [daily, setDaily] = useState<ChallengeState[]>([]);
  const [weekly, setWeekly] = useState<ChallengeState[]>([]);
  const [reveal, setReveal] = useState<Card[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => {
    const c = getChallenges();
    setDaily(c.daily);
    setWeekly(c.weekly);
  };
  useEffect(refresh, []);

  const claim = async (c: ChallengeState) => {
    const res = await claimChallenge(c.id, c.scope);
    if (!res) return;
    if (res.cards.length) setReveal(res.cards);
    else {
      setToast(`+${res.coins.toLocaleString()} coins!`);
      setTimeout(() => setToast(null), 2000);
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
        <h1 className="mt-1 text-3xl font-black">🎯 Challenges</h1>
        <p className="text-sm text-white/50">
          Daily objectives refresh every 24h. Weekly objectives reset each week.
        </p>
      </div>

      <Section title="Daily" sub="Resets in 24h" items={daily} onClaim={claim} />
      <Section title="Weekly" sub="Bigger goals, rarer rewards" items={weekly} onClaim={claim} />
    </div>
  );
}

function Section({
  title,
  sub,
  items,
  onClaim,
}: {
  title: string;
  sub: string;
  items: ChallengeState[];
  onClaim: (c: ChallengeState) => void;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-xs text-white/40">{sub}</span>
      </div>
      <div className="space-y-3">
        {items.map((c) => {
          const pct = Math.round((c.progress / c.goal) * 100);
          return (
            <div key={c.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{c.desc}</div>
                  <div className="text-xs text-white/45">
                    Reward: {c.reward.emoji} {c.reward.label} · +{c.xp} XP
                  </div>
                </div>
                {c.claimed ? (
                  <span className="shrink-0 text-sm font-semibold text-emerald-400">Claimed ✓</span>
                ) : c.complete ? (
                  <button
                    onClick={() => onClaim(c)}
                    className="btn shrink-0 bg-emerald-400 px-4 py-1.5 text-sm text-black hover:bg-emerald-300"
                  >
                    Claim
                  </button>
                ) : (
                  <span className="shrink-0 text-sm tabular-nums text-white/60">
                    {c.progress}/{c.goal}
                  </span>
                )}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className={`h-full rounded-full ${c.complete ? "bg-emerald-400" : "bg-soccer"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
