"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, RARITY_ORDER, tierForCard } from "@/lib/myteam/cards";
import { PlayerCard } from "@/components/myteam/PlayerCard";

interface Props {
  cards: Card[];
  onDone: () => void;
}

// rare pulls deserve a bigger moment
function isHype(c: Card): boolean {
  return RARITY_ORDER.indexOf(c.rarity) >= RARITY_ORDER.indexOf("Diamond");
}

export function PackOpening({ cards, onDone }: Props) {
  // robustness: only ever work with real, resolved cards
  const safe = (cards ?? []).filter(Boolean);
  const [revealed, setRevealed] = useState(0); // number of cards shown

  // nothing to reveal → close immediately rather than crashing
  useEffect(() => {
    if (safe.length === 0) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (safe.length === 0) return null;

  const done = revealed >= safe.length;
  const current = safe[Math.min(revealed, safe.length - 1)];
  const tier = tierForCard(current);

  const best = safe.reduce((a, c) =>
    RARITY_ORDER.indexOf(c.rarity) > RARITY_ORDER.indexOf(a.rarity) ? c : a
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-6 backdrop-blur-md">
      {!done ? (
        <>
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">
            Card {revealed + 1} of {safe.length}
          </p>

          <div className="relative flex items-center justify-center">
            {/* rare-pull rays */}
            {isHype(current) && (
              <motion.div
                key={`rays-${revealed}`}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1.6, opacity: [0, 0.8, 0.5], rotate: 90 }}
                transition={{ duration: 1.2 }}
                className={`pointer-events-none absolute h-72 w-72 rounded-full bg-gradient-to-tr ${tier.grad} blur-2xl`}
              />
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={revealed}
                initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 160, damping: 16 }}
                className="relative"
              >
                <PlayerCard card={current} size="lg" />
              </motion.div>
            </AnimatePresence>
          </div>

          <p className={`mt-5 text-lg font-black ${tier.text}`}>
            {isHype(current) ? "🌟 " : ""}
            {tier.label}
            {isHype(current) ? " pull!" : ""}
          </p>

          <button
            onClick={() => setRevealed((r) => r + 1)}
            className="btn mt-3 bg-white px-8 text-black hover:bg-white/90"
          >
            {revealed + 1 < safe.length ? "Next card →" : "Finish"}
          </button>
          <button onClick={() => setRevealed(safe.length)} className="mt-2 text-xs text-white/40 hover:text-white">
            Skip animation
          </button>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg text-center"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">Pack opened</p>
          <p className={`mt-1 text-2xl font-black ${tierForCard(best).text}`}>
            Best pull: {best.name}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {safe.map((c, i) => (
              <PlayerCard key={i} card={c} size="sm" />
            ))}
          </div>
          <button onClick={onDone} className="btn mt-6 w-full bg-nba text-black hover:bg-nba-gold">
            Add {safe.length} to collection ✓
          </button>
        </motion.div>
      )}
    </div>
  );
}
