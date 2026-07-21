"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DAILY_REWARDS,
  rewardForDay,
  grantReward,
  GrantResult,
  Reward,
} from "@/lib/soccer-myteam/rewards";
import { getDailyStatus, claimDaily, CYCLE_LENGTH } from "@/lib/store/soccer/dailyReward";
import { PlayerCard } from "@/components/soccer-myteam/PlayerCard";
import { tierForCard } from "@/lib/soccer-myteam/cards";
import { useAuth } from "@/lib/auth";
import { claimDailyServer, grantRequest, resync } from "@/lib/store/cloud";
import { getCoins } from "@/lib/store/soccer/myteam";
import { cardById, Card } from "@/lib/soccer-myteam/cards";

interface Props {
  onClose: () => void;
  onClaimed: (result: GrantResult) => void;
}

export function DailyRewardModal({ onClose, onClaimed }: Props) {
  const { user } = useAuth();
  const status = useMemo(() => getDailyStatus(), []);
  const [phase, setPhase] = useState<"track" | "revealed">("track");
  const [result, setResult] = useState<GrantResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const claimedThrough = status.canClaim ? status.pendingDay - 1 : status.pendingDay;
  const activeDay = status.canClaim ? status.pendingDay : null;

  const claim = async () => {
    if (busy) return;
    setClaimError(null);

    if (user) {
      setBusy(true);
      const res = await claimDailyServer("soccer");
      if (!res) {
        setBusy(false);
        setClaimError("You've already claimed today. Come back tomorrow!");
        return;
      }
      const reward = rewardForDay(res.day);
      let granted: GrantResult;
      if (reward.kind === "coins") {
        granted = { reward, coins: res.coins, cards: [], newBalance: getCoins() };
      } else {
        const period = new Date().toISOString().slice(0, 10);
        const gr = await grantRequest({
          type: "reward", sport: "soccer", source: "daily", ref: String(res.day), period,
        });
        const cards = (gr.cardIds ?? []).map(cardById).filter(Boolean) as Card[];
        await resync("soccer");
        granted = { reward, coins: 0, cards, newBalance: getCoins() };
      }
      setBusy(false);
      setResult(granted);
      setPhase("revealed");
      onClaimed(granted);
      return;
    }

    const res = claimDaily();
    if (!res) return;
    const granted = grantReward(rewardForDay(res.day));
    setResult(granted);
    setPhase("revealed");
    onClaimed(granted);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-300/25 bg-ink/95 p-6"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[80px]" />

        <AnimatePresence mode="wait">
          {phase === "track" ? (
            <motion.div key="track" exit={{ opacity: 0 }}>
              <div className="text-center">
                <div className="text-3xl">🎁</div>
                <h2 className="mt-1 text-2xl font-black">Daily Rewards</h2>
                <p className="text-sm text-white/50">
                  {status.canClaim
                    ? "Claim your reward — log in tomorrow to keep the streak."
                    : "You've claimed today. Come back tomorrow!"}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-bold text-emerald-300">
                  🔥 {status.canClaim ? status.pendingStreak : status.streak}-day streak
                </div>
              </div>

              {/* 7-day track */}
              <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {DAILY_REWARDS.map((reward, i) => {
                  const day = i + 1;
                  const done = day <= claimedThrough;
                  const active = day === activeDay;
                  return (
                    <DayTile
                      key={day}
                      day={day}
                      reward={reward}
                      done={done}
                      active={active}
                      isFinale={day === CYCLE_LENGTH}
                    />
                  );
                })}
              </div>

              <button
                onClick={status.canClaim ? claim : onClose}
                disabled={busy}
                className={`btn mt-6 w-full disabled:opacity-60 ${
                  status.canClaim
                    ? "bg-emerald-400 text-black hover:bg-emerald-300"
                    : "border border-white/10 text-white/70 hover:bg-white/5"
                }`}
              >
                {busy
                  ? "Claiming…"
                  : status.canClaim
                  ? `Claim Day ${status.pendingDay} reward`
                  : "Close"}
              </button>
              {claimError && (
                <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-center text-sm text-emerald-200">
                  {claimError}
                </div>
              )}
              {status.canClaim && (
                <button onClick={onClose} className="mt-2 w-full text-xs text-white/40 hover:text-white">
                  Maybe later
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="text-sm uppercase tracking-[0.3em] text-emerald-300">
                Day {status.pendingDay} claimed
              </div>
              {result && <RewardReveal result={result} />}
              <button
                onClick={onClose}
                className="btn mt-6 w-full bg-emerald-400 text-black hover:bg-emerald-300"
              >
                Awesome →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function DayTile({
  day,
  reward,
  done,
  active,
  isFinale,
}: {
  day: number;
  reward: Reward;
  done: boolean;
  active: boolean;
  isFinale: boolean;
}) {
  return (
    <motion.div
      animate={active ? { scale: [1, 1.06, 1] } : {}}
      transition={active ? { duration: 1.4, repeat: Infinity } : {}}
      className={`relative flex flex-col items-center justify-center rounded-xl border p-2 text-center ${
        active
          ? "border-emerald-300 bg-emerald-400/15 shadow-[0_0_24px_-6px_rgba(52,211,153,0.7)]"
          : done
          ? "border-emerald-400/30 bg-emerald-400/5"
          : isFinale
          ? "border-fuchsia-400/40 bg-fuchsia-500/10"
          : "border-white/10 bg-panel/50"
      }`}
    >
      <div className="text-[9px] font-bold uppercase tracking-wide text-white/40">
        Day {day}
      </div>
      <div className="my-0.5 text-xl">{done ? "✅" : reward.emoji}</div>
      <div className="text-[9px] leading-tight text-white/60">{reward.label}</div>
      {active && (
        <span className="absolute -top-2 rounded-full bg-emerald-400 px-1.5 text-[8px] font-black text-black">
          TODAY
        </span>
      )}
    </motion.div>
  );
}

function RewardReveal({ result }: { result: GrantResult }) {
  if (result.cards.length > 0) {
    const best = result.cards.reduce((a, c) => (c.overall > a.overall ? c : a));
    return (
      <div className="mt-3">
        <p className="text-lg font-bold">
          You pulled <span className={tierForCard(best).text}>{best.name}</span>!
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {result.cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 160, damping: 16 }}
            >
              <PlayerCard card={c} size={result.cards.length === 1 ? "lg" : "sm"} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 14 }}
      className="mt-4"
    >
      <div className="text-6xl">🪙</div>
      <div className="mt-2 text-4xl font-black tabular-nums text-emerald-300">
        +{result.coins.toLocaleString()}
      </div>
      <div className="text-sm text-white/50">Dynasty Coins</div>
    </motion.div>
  );
}
