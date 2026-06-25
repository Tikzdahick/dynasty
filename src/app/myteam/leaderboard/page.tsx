"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { cardById, tierForCard, Card } from "@/lib/myteam/cards";
import { getOwned, getLineup } from "@/lib/store/myteam";
import { resolveCard } from "@/lib/store/upgrades";
import { computeTeamChemistry } from "@/lib/myteam/teamChemistry";
import { teamOverall } from "@/lib/myteam/lineup";
import { getRecord, recordResult } from "@/lib/store/myteamRecord";
import { getRivalDeltas } from "@/lib/store/rivals";
import { onGamePlayed } from "@/lib/myteam/events";
import { buildLeaderboard, LeaderboardEntry } from "@/lib/myteam/leaderboard";
import { simulateExhibition, ExhibitionResult } from "@/lib/myteam/exhibition";

export default function MyTeamLeaderboardPage() {
  const { displayName, guestName } = useAuth();
  const username =
    displayName && displayName !== "Guest" ? displayName : guestName || "You";

  const [teamOvr, setTeamOvr] = useState(0);
  const [record, setRecord] = useState({ wins: 0, losses: 0, streak: 0 });
  const [bestCard, setBestCard] = useState<Card | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [lastResult, setLastResult] = useState<ExhibitionResult | null>(null);
  const [playing, setPlaying] = useState(false);

  const recompute = useCallback(() => {
    // team OVR from the saved lineup
    const lineup = getLineup();
    const starters = lineup.starters
      .map((id) => (id ? resolveCard(id) : undefined))
      .filter(Boolean) as Card[];
    const bench = lineup.bench
      .map((id) => (id ? resolveCard(id) : undefined))
      .filter(Boolean) as Card[];
    const ovr = teamOverall(starters, bench) + computeTeamChemistry(starters).bonus;

    // best owned card
    const owned = getOwned()
      .map((o) => resolveCard(o.cardId))
      .filter(Boolean) as Card[];
    const best = owned.length
      ? owned.reduce((a, c) => (c.overall > a.overall ? c : a))
      : null;

    const rec = getRecord();
    setTeamOvr(ovr);
    setBestCard(best);
    setRecord(rec);
    setEntries(
      buildLeaderboard(
        {
          username,
          teamOvr: ovr,
          wins: rec.wins,
          losses: rec.losses,
          bestCard: best,
        },
        getRivalDeltas()
      )
    );
  }, [username]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  const play = () => {
    if (teamOvr <= 0 || playing) return;
    setPlaying(true);
    const result = simulateExhibition(teamOvr);
    recordResult(result.win);
    onGamePlayed(result.win);
    setLastResult(result);
    recompute();
    setTimeout(() => setPlaying(false), 400);
  };

  const you = entries.find((e) => e.isYou);

  return (
    <div className="bg-grain">
      {/* header */}
      <div className="mb-5">
        <Link href="/myteam" className="text-sm text-white/40 hover:text-white">
          ← MyTeam
        </Link>
        <h1 className="mt-1 text-3xl font-black">🏆 MyTeam Leaderboard</h1>
        <p className="text-sm text-white/50">
          Ranked by team rating and wins. Play games to climb.
        </p>
      </div>

      {/* your standing + play */}
      <div className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Rank</div>
            <div className="text-3xl font-black text-amber-300">
              {you ? `#${you.rank}` : "—"}
            </div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div>
            <div className="text-sm font-bold">{username} (you)</div>
            <div className="text-xs text-white/50">
              Team OVR <span className="font-bold text-nba">{teamOvr || "—"}</span> · Record{" "}
              <span className="font-semibold">{record.wins}-{record.losses}</span>
              {record.streak !== 0 && (
                <span className={record.streak > 0 ? "text-emerald-400" : "text-red-400"}>
                  {" "}· {record.streak > 0 ? `W${record.streak}` : `L${-record.streak}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {teamOvr > 0 ? (
          <div className="flex gap-2">
            <Link
              href="/myteam/rivals"
              className="btn border border-red-500/40 bg-red-500/10 px-4 text-red-300 hover:bg-red-500/20"
            >
              ⚔️ Rivals
            </Link>
            <button
              onClick={play}
              disabled={playing}
              className="btn bg-nba px-6 text-black hover:bg-nba-gold"
            >
              ▶ Play a game
            </button>
          </div>
        ) : (
          <Link href="/myteam/team" className="btn bg-nba px-6 text-black hover:bg-nba-gold">
            Build your team →
          </Link>
        )}
      </div>

      {/* last game result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            key={`${lastResult.opponent}-${record.wins}-${record.losses}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 rounded-2xl border p-4 text-center ${
              lastResult.win
                ? "border-emerald-400/40 bg-emerald-400/10"
                : "border-red-500/40 bg-red-500/10"
            }`}
          >
            <span className={`font-black ${lastResult.win ? "text-emerald-300" : "text-red-300"}`}>
              {lastResult.win ? "WIN" : "LOSS"}
            </span>{" "}
            <span className="tabular-nums">
              {lastResult.teamScore}–{lastResult.oppScore}
            </span>{" "}
            <span className="text-white/50">vs {lastResult.opponent}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ranked list */}
      <div className="space-y-2">
        {entries.map((e) => (
          <Row key={`${e.username}-${e.rank}`} entry={e} />
        ))}
      </div>
    </div>
  );
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  const card = entry.bestCardId ? cardById(entry.bestCardId) : null;
  const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={`flex items-center gap-3 rounded-2xl border p-3 ${
        entry.isYou
          ? "border-nba/50 bg-nba/10"
          : "border-white/5 bg-panel/60"
      }`}
    >
      <div className="w-9 shrink-0 text-center text-lg font-black tabular-nums text-white/70">
        {medal ?? entry.rank}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">
          {entry.username}
          {entry.isYou && <span className="ml-1 text-xs text-nba">(you)</span>}
        </div>
        <div className="text-xs text-white/45">
          {entry.wins}-{entry.losses}
          {card && (
            <>
              {" · best "}
              <span className={tierForCard(card).text}>{card.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-[10px] uppercase tracking-widest text-white/40">OVR</div>
        <div className="text-xl font-black tabular-nums text-nba">{entry.teamOvr || "—"}</div>
      </div>
    </motion.div>
  );
}
