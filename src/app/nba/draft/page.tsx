"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RoundDraft, DraftMode } from "@/components/RoundDraft";
import { SlotDef } from "@/components/Court";
import { nbaDeck } from "@/lib/draft/candidates";
import { simulateSeason, teamRating } from "@/lib/nba/sim";
import { NbaPlayer, NbaSeasonResult } from "@/types";
import { useAuth } from "@/lib/auth";
import { saveNbaResult } from "@/lib/store/leaderboard";

const NBA_SLOTS: SlotDef[] = [
  { id: "pg", position: "PG", label: "PG", x: 58, y: 26 },
  { id: "sg", position: "SG", label: "SG", x: 84, y: 46 },
  { id: "sf", position: "SF", label: "SF", x: 16, y: 46 },
  { id: "pf", position: "PF", label: "PF", x: 33, y: 70 },
  { id: "c", position: "C", label: "C", x: 64, y: 74 },
  { id: "b1", position: "ANY", label: "Bench", bench: true },
  { id: "b2", position: "ANY", label: "Bench", bench: true },
  { id: "b3", position: "ANY", label: "Bench", bench: true },
];

type Phase = "draft" | "sim" | "done";

export default function NbaDraftPage() {
  const router = useRouter();
  const [mode, setMode] = useState<DraftMode | null>(null);
  const [phase, setPhase] = useState<Phase>("draft");
  const [roster, setRoster] = useState<NbaPlayer[]>([]);
  const [season, setSeason] = useState<NbaSeasonResult | null>(null);

  useEffect(() => {
    setMode((sessionStorage.getItem("dynasty.nba.mode") as DraftMode) || "classic");
  }, []);

  const onConfirm = (placed: (NbaPlayer | null)[]) => {
    const starters = placed.slice(0, 5).filter(Boolean) as NbaPlayer[];
    const bench = placed.slice(5, 8).filter(Boolean) as NbaPlayer[];
    setRoster([...starters, ...bench]);
    setSeason(simulateSeason(teamRating(starters, bench)));
    setPhase("sim");
  };

  if (!mode) return null;

  return (
    <div className="bg-grain">
      {phase === "draft" && (
        <RoundDraft<NbaPlayer>
          variant="nba"
          accent="nba"
          slots={NBA_SLOTS}
          starterCount={5}
          benchCount={3}
          deck={nbaDeck}
          mode={mode}
          contextLabel={`NBA · ${labelFor(mode)}`}
          confirmLabel="Confirm roster → Tip off"
          onConfirm={onConfirm}
          onExit={() => router.push("/nba")}
        />
      )}
      {phase === "sim" && season && (
        <SeasonSim season={season} onDone={() => setPhase("done")} />
      )}
      {phase === "done" && season && (
        <SeasonResult
          season={season}
          roster={roster}
          mode={mode}
          onReset={() => router.push("/nba")}
        />
      )}
    </div>
  );
}

function labelFor(m: DraftMode): string {
  return m === "classic" ? "Classic" : m === "iq" ? "Hoop IQ" : m === "daily" ? "Daily Challenge" : "Team Draft";
}

/* ----------------------------- SIM ----------------------------- */
function SeasonSim({ season, onDone }: { season: NbaSeasonResult; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shown >= season.games.length) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((s) => s + 1), shown < 4 ? 260 : 70);
    return () => clearTimeout(t);
  }, [shown, season.games.length, onDone]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [shown]);

  const games = season.games.slice(0, shown);
  const wins = games.filter((g) => g.win).length;
  const losses = games.length - wins;

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-white/40">Simulating season</p>
      <div className="my-4 text-6xl font-black tabular-nums">
        <span className="text-nba">{wins}</span>
        <span className="text-white/30"> - </span>
        <span className="text-white/70">{losses}</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-gradient-to-r from-nba to-nba-gold transition-all" style={{ width: `${(shown / season.games.length) * 100}%` }} />
      </div>
      <div ref={listRef} className="card max-h-80 space-y-1.5 overflow-y-auto p-3 text-left">
        {games.map((g) => (
          <motion.div
            key={g.game}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${g.win ? "bg-nba/10" : "bg-red-500/10"}`}
          >
            <span className="text-white/40">#{g.game}</span>
            <span className="flex-1 px-3 text-white/70">vs {g.opponent}</span>
            <span className="font-semibold tabular-nums">{g.teamScore}–{g.oppScore}</span>
            <span className={`ml-3 w-5 text-center font-bold ${g.win ? "text-nba" : "text-red-400"}`}>{g.win ? "W" : "L"}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- RESULT ----------------------------- */
function gradeFor(wins: number): string {
  if (wins === 82) return "S+";
  if (wins >= 78) return "S";
  if (wins >= 70) return "A";
  if (wins >= 60) return "B";
  if (wins >= 45) return "C";
  return "D";
}

function analyze(roster: NbaPlayer[]): { strengths: string[]; weaknesses: string[] } {
  if (roster.length === 0) return { strengths: [], weaknesses: [] };
  const avg = (k: "ppg" | "rpg" | "apg") => roster.reduce((a, p) => a + p[k], 0) / roster.length;
  const metrics = [
    { label: "Scoring", v: avg("ppg") / 25 },
    { label: "Rebounding", v: avg("rpg") / 9 },
    { label: "Playmaking", v: avg("apg") / 6 },
  ].sort((a, b) => b.v - a.v);
  return {
    strengths: metrics.slice(0, 1).map((m) => m.label),
    weaknesses: metrics.slice(-1).map((m) => m.label),
  };
}

function SeasonResult({
  season,
  roster,
  mode,
  onReset,
}: {
  season: NbaSeasonResult;
  roster: NbaPlayer[];
  mode: DraftMode;
  onReset: () => void;
}) {
  const { user, displayName, guestName, setGuestName } = useAuth();
  const [name, setName] = useState(displayName !== "Guest" ? displayName : guestName);
  const [saved, setSaved] = useState<"idle" | "saving" | "cloud" | "local">("idle");
  const undefeated = season.losses === 0;
  const grade = gradeFor(season.wins);
  const { strengths, weaknesses } = analyze(roster);

  const save = async () => {
    if (!name.trim()) return;
    if (!user) setGuestName(name.trim());
    setSaved("saving");
    const res = await saveNbaResult({
      username: name.trim(),
      wins: season.wins,
      losses: season.losses,
      players: roster.map((p) => p.name),
      rating: season.teamRating,
    });
    setSaved(res.saved);
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      {undefeated && <Confetti />}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">Final record · {labelFor(mode)}</p>
        <div className="my-3 text-7xl font-black tabular-nums">
          <span className="text-nba">{season.wins}</span>
          <span className="text-white/30">-</span>
          <span className="text-white/70">{season.losses}</span>
        </div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1">
          <span className="text-xs text-white/40">Grade</span>
          <span className="text-xl font-black text-nba-gold">{grade}</span>
        </div>
        <p className="text-lg font-semibold">
          {undefeated ? "🏆 PERFECT SEASON — 82-0!" : season.wins >= 70 ? "🔥 Historic season." : season.wins >= 50 ? "Solid playoff team." : "Rebuild incoming."}
        </p>
        <p className="mt-1 text-sm text-white/40">Team rating {season.teamRating}</p>
      </motion.div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-left text-sm">
        <div className="card p-3">
          <div className="text-xs uppercase text-white/40">Strength</div>
          <div className="font-bold text-nba">{strengths[0] ?? "—"}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs uppercase text-white/40">Weakness</div>
          <div className="font-bold text-red-400">{weaknesses[0] ?? "—"}</div>
        </div>
      </div>

      <div className="card mt-4 p-4 text-left">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Your roster</div>
        <div className="flex flex-wrap gap-1.5">
          {roster.map((p) => (
            <span key={p.id} className="rounded-lg bg-white/5 px-2 py-1 text-xs">{p.name}</span>
          ))}
        </div>
      </div>

      <div className="card mt-4 p-4">
        {saved === "cloud" || saved === "local" ? (
          <div className="text-sm">
            <p className="font-semibold text-nba">Saved to leaderboard ✓</p>
            <p className="mt-1 text-white/40">
              {saved === "local" ? "Stored on this device. Sign in to save to the global board." : "Posted to the global leaderboard."}
            </p>
            <Link href="/leaderboard" className="btn-ghost mt-3 w-full">View leaderboard →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="flex-1 rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-sm outline-none focus:border-nba/60" />
            <button onClick={save} disabled={!name.trim() || saved === "saving"} className="btn bg-nba text-black hover:bg-nba-gold">
              {saved === "saving" ? "Saving…" : "Save result"}
            </button>
          </div>
        )}
      </div>

      <button onClick={onReset} className="btn-ghost mt-4 w-full">Draft again ↺</button>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = ["#f97316", "#fbbf24", "#22c55e", "#ffffff"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 1 }}
          animate={{ y: "110vh", rotate: Math.random() * 720 }}
          transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.6 }}
          className="absolute h-2 w-2 rounded-sm"
          style={{ background: colors[i % colors.length] }}
        />
      ))}
    </div>
  );
}
