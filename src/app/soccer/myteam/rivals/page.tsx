"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Card } from "@/lib/soccer-myteam/cards";
import { PlayerCard } from "@/components/soccer-myteam/PlayerCard";
import { getLineup } from "@/lib/store/soccer/myteam";
import { resolveCard } from "@/lib/store/soccer/upgrades";
import { computeTeamChemistry } from "@/lib/soccer-myteam/teamChemistry";
import { teamOverall } from "@/lib/soccer-myteam/lineup";
import { getRecord, recordResult } from "@/lib/store/soccer/myteamRecord";
import { getRivalDeltas, applyRivalResult } from "@/lib/store/soccer/rivals";
import { onGamePlayed } from "@/lib/soccer-myteam/events";
import {
  findRivals,
  simulateHeadToHead,
  RivalProfile,
  HeadToHead,
} from "@/lib/soccer-myteam/rivals";

interface UserSide {
  name: string;
  ovr: number;
  roster: Card[];
  wins: number;
  losses: number;
}

export default function RivalsPage() {
  const { displayName, guestName } = useAuth();
  const username =
    displayName && displayName !== "Guest" ? displayName : guestName || "You";

  const [user, setUser] = useState<UserSide>({ name: username, ovr: 0, roster: [], wins: 0, losses: 0 });
  const [rivals, setRivals] = useState<RivalProfile[]>([]);
  const [challenge, setChallenge] = useState<RivalProfile | null>(null);

  const refresh = useCallback(() => {
    const lineup = getLineup();
    const starters = lineup.starters
      .map((id) => (id ? resolveCard(id) : undefined))
      .filter(Boolean) as Card[];
    const bench = lineup.bench
      .map((id) => (id ? resolveCard(id) : undefined))
      .filter(Boolean) as Card[];
    const ovr = teamOverall(starters, bench) + computeTeamChemistry(starters).bonus;
    const rec = getRecord();
    setUser({ name: username, ovr, roster: starters.slice(0, 6), wins: rec.wins, losses: rec.losses });
    setRivals(findRivals(ovr, getRivalDeltas()));
  }, [username]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onResolved = (rival: RivalProfile, h: HeadToHead) => {
    recordResult(h.userWon);
    applyRivalResult(rival.username, !h.userWon);
    onGamePlayed(h.userWon, { vsRival: true });
    refresh();
  };

  return (
    <div className="bg-grain">
      <div className="mb-5">
        <Link href="/soccer/myteam" className="text-sm text-white/40 hover:text-white">
          ← Soccer MyTeam
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-black">
          ⚔️ Rivals
        </h1>
        <p className="text-sm text-white/50">
          Challenge managers near your rating. Every match counts on the leaderboard.
        </p>
      </div>

      {/* your snapshot */}
      <div className="card mb-6 flex items-center justify-between p-4">
        <div>
          <div className="text-sm font-bold">{user.name} (you)</div>
          <div className="text-xs text-white/50">
            Team OVR <span className="font-bold text-soccer">{user.ovr || "—"}</span> · {user.wins}-{user.losses}
          </div>
        </div>
        <Link href="/soccer/myteam/leaderboard" className="text-sm text-white/50 hover:text-white">
          Leaderboard →
        </Link>
      </div>

      {user.ovr <= 0 ? (
        <div className="card p-10 text-center text-sm text-white/45">
          Build a starting XI before you can challenge rivals.{" "}
          <Link href="/soccer/myteam/team" className="text-soccer underline">
            Squad Builder →
          </Link>
        </div>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-bold">Rivals near your rating</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {rivals.map((r) => (
              <RivalCard key={r.username} rival={r} userOvr={user.ovr} onChallenge={() => setChallenge(r)} />
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {challenge && (
          <RivalMatch
            user={user}
            rival={challenge}
            onResolved={(h) => onResolved(challenge, h)}
            onClose={() => setChallenge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function diffLabel(diff: number): { text: string; cls: string } {
  if (diff <= 2) return { text: "Even match", cls: "text-emerald-400" };
  if (diff <= 5) return { text: "Close", cls: "text-amber-300" };
  return { text: "Mismatch", cls: "text-red-400" };
}

function RivalCard({
  rival,
  userOvr,
  onChallenge,
}: {
  rival: RivalProfile;
  userOvr: number;
  onChallenge: () => void;
}) {
  const dl = diffLabel(Math.abs(rival.teamOvr - userOvr));
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/40 to-amber-500/30 text-xl font-black">
        {rival.username.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{rival.username}</div>
        <div className="text-xs text-white/50">
          OVR <span className="font-bold text-soccer">{rival.teamOvr}</span> · {rival.wins}-{rival.losses}
        </div>
        <div className={`text-[11px] font-semibold ${dl.cls}`}>{dl.text}</div>
      </div>
      <button onClick={onChallenge} className="btn shrink-0 bg-red-500 px-4 text-sm text-white hover:bg-red-400">
        Challenge
      </button>
    </div>
  );
}

function RivalMatch({
  user,
  rival,
  onResolved,
  onClose,
}: {
  user: UserSide;
  rival: RivalProfile;
  onResolved: (h: HeadToHead) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"pre" | "playing" | "result">("pre");
  const [result, setResult] = useState<HeadToHead | null>(null);

  const start = () => {
    setPhase("playing");
    const h = simulateHeadToHead(user.ovr, rival.teamOvr);
    setTimeout(() => {
      setResult(h);
      setPhase("result");
      onResolved(h);
    }, 1900);
  };

  const rematch = () => {
    setResult(null);
    setPhase("pre");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md"
    >
      <div className="mx-auto min-h-full max-w-3xl p-5">
        {/* VS header */}
        <div className="mb-5 flex items-center justify-center gap-4 pt-4 text-center sm:gap-8">
          <SideHead name={user.name} ovr={user.ovr} accent="text-soccer" />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black text-red-500 sm:text-5xl"
          >
            VS
          </motion.div>
          <SideHead name={rival.username} ovr={rival.teamOvr} accent="text-red-400" />
        </div>

        {phase === "result" && result ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className={`text-sm uppercase tracking-[0.3em] ${result.userWon ? "text-emerald-400" : "text-red-400"}`}>
              {result.userWon ? "Victory" : result.userScore === result.rivalScore ? "Draw" : "Defeat"}
            </div>
            <div className="my-2 text-6xl font-black tabular-nums">
              <span className={result.userWon ? "text-soccer" : "text-white/70"}>{result.userScore}</span>
              <span className="text-white/30"> – </span>
              <span className={!result.userWon ? "text-red-400" : "text-white/70"}>{result.rivalScore}</span>
            </div>
            <p className="text-sm text-white/50">Records updated on the leaderboard.</p>
            <div className="mx-auto mt-6 flex max-w-sm gap-3">
              <button onClick={rematch} className="btn flex-1 border border-white/10 text-white/80 hover:bg-white/5">
                Rematch
              </button>
              <Link href="/soccer/myteam/leaderboard" className="btn flex-1 bg-white/10 text-white hover:bg-white/15">
                Leaderboard
              </Link>
              <button onClick={onClose} className="btn flex-1 bg-soccer text-black hover:bg-soccer-gold">
                Done
              </button>
            </div>
          </motion.div>
        ) : phase === "playing" ? (
          <div className="py-16 text-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="text-5xl"
            >
              ⚽
            </motion.div>
            <p className="mt-4 text-sm uppercase tracking-[0.3em] text-white/40">Kick-off…</p>
          </div>
        ) : (
          <>
            {/* scout both squads before accepting */}
            <RosterStrip title="Your key players" cards={user.roster} accent="border-soccer/40" />
            <div className="my-4 text-center text-xs uppercase tracking-widest text-red-400/80">
              ⚡ Scouting report ⚡
            </div>
            <RosterStrip title={`${rival.username}'s key players`} cards={rival.roster} accent="border-red-500/40" />

            <div className="sticky bottom-0 mt-6 flex gap-3 bg-gradient-to-t from-black/80 to-transparent pt-6">
              <button onClick={onClose} className="btn flex-1 border border-white/10 text-white/80 hover:bg-white/5">
                Back out
              </button>
              <button onClick={start} className="btn flex-[2] bg-red-500 text-white hover:bg-red-400">
                Accept Challenge ⚔️
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function SideHead({ name, ovr, accent }: { name: string; ovr: number; accent: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-bold">{name}</div>
      <div className={`text-3xl font-black tabular-nums ${accent}`}>{ovr || "—"}</div>
      <div className="text-[10px] uppercase tracking-widest text-white/40">Team OVR</div>
    </div>
  );
}

function RosterStrip({ title, cards, accent }: { title: string; cards: Card[]; accent: string }) {
  return (
    <div className={`rounded-2xl border ${accent} bg-panel/40 p-3`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">{title}</div>
      {cards.length === 0 ? (
        <div className="py-4 text-center text-xs text-white/40">No players set.</div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {cards.map((c) => (
            <PlayerCard key={c.id} card={c} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}
