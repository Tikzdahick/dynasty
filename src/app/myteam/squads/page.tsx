"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Card } from "@/lib/myteam/cards";
import { PlayerCard } from "@/components/myteam/PlayerCard";
import { getLineup } from "@/lib/store/myteam";
import { resolveCard } from "@/lib/store/upgrades";
import { teamOverall } from "@/lib/myteam/lineup";
import { computeTeamChemistry, CHEM_COLORS } from "@/lib/myteam/teamChemistry";
import { botSquads, userSquad, Squad } from "@/lib/myteam/squads";
import { isShared, setShared, isLiked, toggleLike, likeCount } from "@/lib/store/squads";

export default function SquadsPage() {
  const { displayName, guestName } = useAuth();
  const username =
    displayName && displayName !== "Guest" ? displayName : guestName || "You";

  const [shared, setSharedState] = useState(false);
  const [tick, setTick] = useState(0); // re-render on like
  const [view, setView] = useState<Squad | null>(null);
  const [userOvr, setUserOvr] = useState(0);
  const [userRoster, setUserRoster] = useState<Card[]>([]);

  const refresh = useCallback(() => {
    const lineup = getLineup();
    const starters = lineup.starters
      .map((id) => (id ? resolveCard(id) : undefined))
      .filter(Boolean) as Card[];
    const bench = lineup.bench
      .map((id) => (id ? resolveCard(id) : undefined))
      .filter(Boolean) as Card[];
    const chem = computeTeamChemistry(starters);
    setUserRoster(starters);
    setUserOvr(teamOverall(starters, bench) + chem.bonus);
    setSharedState(isShared());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const squads = useMemo(() => {
    const list = [...botSquads()];
    if (shared && userRoster.length > 0) {
      list.push(userSquad(username, userRoster, userOvr));
    }
    return list.sort((a, b) => b.ovr - a.ovr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared, userRoster, userOvr, username, tick]);

  const like = (id: string) => {
    toggleLike(id);
    setTick((t) => t + 1);
  };

  return (
    <div className="bg-grain">
      <div className="mb-5">
        <Link href="/myteam" className="text-sm text-white/40 hover:text-white">
          ← MyTeam
        </Link>
        <h1 className="mt-1 text-3xl font-black">🌍 Squads</h1>
        <p className="text-sm text-white/50">Browse the community&apos;s teams. Like the ones you rate.</p>
      </div>

      {/* share toggle */}
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-bold">Share your squad</div>
          <div className="text-xs text-white/50">
            {userRoster.length === 0
              ? "Build a starting five to share it."
              : shared
              ? "Your squad is public on the Squads board."
              : "Make your team public so others can see and like it."}
          </div>
        </div>
        <button
          onClick={() => {
            const next = !shared;
            setShared(next);
            setSharedState(next);
          }}
          disabled={userRoster.length === 0}
          className={`btn shrink-0 ${
            shared ? "border border-white/15 text-white/80 hover:bg-white/5" : "bg-nba text-black hover:bg-nba-gold"
          } disabled:opacity-40`}
        >
          {shared ? "Make private" : "Share my squad"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {squads.map((s) => (
          <SquadCard key={s.id} squad={s} onView={() => setView(s)} onLike={() => like(s.id)} />
        ))}
      </div>

      <AnimatePresence>
        {view && <RosterModal squad={view} onClose={() => setView(null)} />}
      </AnimatePresence>
    </div>
  );
}

function SquadCard({
  squad,
  onView,
  onLike,
}: {
  squad: Squad;
  onView: () => void;
  onLike: () => void;
}) {
  const liked = isLiked(squad.id);
  return (
    <div className={`card p-4 ${squad.isYou ? "border-nba/50" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate font-bold">
            {squad.owner}
            {squad.isYou && <span className="ml-1 text-xs text-nba">(you)</span>}
          </div>
          <div className="text-xs text-white/50">
            OVR <span className="font-bold text-nba">{squad.ovr}</span> ·{" "}
            <span className={CHEM_COLORS[squad.chemistry.label]}>
              {squad.chemistry.label === "None" ? "Low" : squad.chemistry.label} chem
            </span>
          </div>
        </div>
        <button
          onClick={onLike}
          className={`shrink-0 rounded-xl px-2.5 py-1.5 text-sm font-semibold transition ${
            liked ? "bg-red-500/20 text-red-300" : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          {liked ? "❤️" : "🤍"} {likeCount(squad.id)}
        </button>
      </div>

      {squad.bestCard && (
        <div className="mt-3 flex items-center gap-3">
          <div className="w-16 shrink-0">
            <PlayerCard card={squad.bestCard} size="sm" />
          </div>
          <div className="text-xs text-white/50">
            Best card
            <div className="font-semibold text-white/80">{squad.bestCard.name}</div>
          </div>
        </div>
      )}

      <button onClick={onView} className="btn-ghost mt-3 w-full py-1.5 text-sm">
        View squad →
      </button>
    </div>
  );
}

function RosterModal({ squad, onClose }: { squad: Squad; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-t-3xl border border-white/10 bg-ink/95 p-5 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{squad.owner}&apos;s squad</h3>
            <div className="text-xs text-white/50">
              OVR {squad.ovr} ·{" "}
              <span className={CHEM_COLORS[squad.chemistry.label]}>
                {squad.chemistry.label} chemistry
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {squad.roster.map((c) => (
            <PlayerCard key={c.id} card={c} size="sm" />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
