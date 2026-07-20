"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Step {
  icon: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: "🎴",
    title: "Open packs",
    body: "Packs are how you collect player cards. Pricier packs cost more Dynasty Coins but have far better odds at rare, higher-rated legends. Every card you pull is yours to keep.",
  },
  {
    icon: "🧩",
    title: "Build your team",
    body: "Assemble a squad from the cards you own. In NBA you fill five positions (PG through C); in Soccer you pick a formation — 4-3-3, 4-4-2, 3-5-2 — and fill every slot, plus subs.",
  },
  {
    icon: "🔗",
    title: "Chemistry",
    body: "Line up players who share a nation, club, or era and they build chemistry — a boost to your team rating. A themed squad (say, a Barcelona spine) often beats one picked on raw ratings alone.",
  },
  {
    icon: "🪙",
    title: "Coins",
    body: "Dynasty Coins buy packs and auction bids. Earn them from daily rewards, challenges, rivals, and selling cards you don’t need. New here? Redeem code 2040 for a head start.",
  },
];

export function Tutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const finish = () => {
    setI(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={finish}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-ink"
          >
            <div className="flex items-center justify-between px-5 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Welcome to Dynasty · {i + 1}/{STEPS.length}
              </span>
              <button onClick={finish} className="text-sm text-white/40 hover:text-white" aria-label="Skip tutorial">
                Skip
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-6 text-center"
              >
                <div className="mb-3 text-5xl">{step.icon}</div>
                <h2 className="text-xl font-black">{step.title}</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/60">{step.body}</p>
              </motion.div>
            </AnimatePresence>

            {/* progress dots */}
            <div className="flex justify-center gap-1.5 pb-4">
              {STEPS.map((_, n) => (
                <span
                  key={n}
                  className={`h-1.5 rounded-full transition-all ${
                    n === i ? "w-5 bg-white" : "w-1.5 bg-white/25"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-white/5 p-4">
              {i > 0 ? (
                <button
                  onClick={() => setI((n) => n - 1)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Back
                </button>
              ) : (
                <div className="flex-1" />
              )}
              <div className="flex-1" />
              <button
                onClick={() => (last ? finish() : setI((n) => n + 1))}
                className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-white/90"
              >
                {last ? "Got it!" : "Next"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
