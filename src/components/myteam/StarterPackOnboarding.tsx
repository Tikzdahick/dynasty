"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEAMS, teamById } from "@/lib/myteam/teams";
import { TeamBadge } from "@/components/myteam/TeamBadge";

interface Props {
  onPick: (teamId: string) => void;
}

export function StarterPackOnboarding({ onPick }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const team = selected ? teamById(selected) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/97 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Welcome to Dynasty
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Pick your{" "}
            <span className="bg-gradient-to-r from-nba via-amber-300 to-fuchsia-400 bg-clip-text text-transparent">
              team
            </span>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            Choose your franchise to claim a free Starter Pack of players to build from.
          </p>
        </motion.div>

        {/* team grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TEAMS.map((t, i) => {
            const active = selected === t.id;
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.04 * i }}
                onClick={() => setSelected(t.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${
                  active
                    ? "border-white/40 bg-white/10 shadow-[0_0_30px_-8px_rgba(255,255,255,0.4)]"
                    : "border-white/10 bg-panel/60 hover:border-white/25 hover:-translate-y-0.5"
                }`}
              >
                <TeamBadge team={t} size={64} />
                <div className="text-center leading-tight">
                  <div className="text-[11px] text-white/45">{t.city}</div>
                  <div className="text-sm font-bold">{t.name}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* sticky claim bar */}
      <AnimatePresence>
        {team && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="border-t border-white/10 bg-ink/95 p-4"
          >
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TeamBadge team={team} size={44} />
                <div>
                  <div className="text-xs text-white/45">Your franchise</div>
                  <div className="font-bold">
                    {team.city} {team.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onPick(team.id)}
                className="btn bg-amber-400 px-6 text-black hover:bg-amber-300"
              >
                Claim Starter Pack 🎉
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
