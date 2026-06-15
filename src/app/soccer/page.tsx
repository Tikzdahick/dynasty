"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SOCCER_PLAYERS, SOCCER_BUDGET } from "@/lib/soccer/players";
import { FORMATIONS, SUB_REQUIREMENTS } from "@/lib/soccer/formations";
import { simulateTournament } from "@/lib/soccer/sim";
import {
  FormationName,
  SoccerPlayer,
  SoccerPosition,
  SoccerTournamentResult,
  SpinResult,
} from "@/types";
import { Pitch } from "@/components/Pitch";
import { useAuth } from "@/lib/auth";
import { saveSoccerResult } from "@/lib/store/leaderboard";
import { SpinMachine } from "@/components/SpinMachine";
import { ModePicker } from "@/components/ModePicker";

type SubMode = "classic" | "iq";
type Phase = "mode" | "spin" | "setup" | "draft" | "sim" | "done";

const XI = 11;
const TOTAL = XI + SUB_REQUIREMENTS;

export default function SoccerPage() {
  const [phase, setPhase] = useState<Phase>("mode");
  const [mode, setMode] = useState<"classic" | "spin">("classic");
  const [subMode, setSubMode] = useState<SubMode>("classic");
  const [formationName, setFormationName] = useState<FormationName>("4-3-3");
  const [assignment, setAssignment] = useState<(SoccerPlayer | null)[]>(
    Array(TOTAL).fill(null)
  );
  const [result, setResult] = useState<SoccerTournamentResult | null>(null);

  // spin state
  const [spinResult, setSpinResult] = useState<SpinResult<SoccerPlayer> | null>(null);

  const pool = useMemo(() => {
    if (!spinResult) return SOCCER_PLAYERS;
    const combined = [
      spinResult.locked,
      ...spinResult.teamPlayers,
      ...spinResult.fillPlayers,
    ];
    const seen = new Set<string>();
    return combined.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  }, [spinResult]);

  const lockedId = spinResult ? spinResult.locked.id : null;
  const hideStats = mode === "classic" && subMode === "iq";

  const startClassic = () => {
    setMode("classic");
    setSpinResult(null);
    setPhase("setup");
  };

  const onSpinComplete = (r: SpinResult<SoccerPlayer>) => {
    setMode("spin");
    setSpinResult(r);
    setSubMode("classic");
    setPhase("setup");
  };

  const goToDraft = () => {
    const next: (SoccerPlayer | null)[] = Array(TOTAL).fill(null);
    if (spinResult) {
      const slots = FORMATIONS[formationName].slots;
      const idx = slots.findIndex((s) => s.position === spinResult.locked.position);
      next[idx >= 0 ? idx : 0] = spinResult.locked;
    }
    setAssignment(next);
    setPhase("draft");
  };

  const start = () => {
    const xi = assignment.slice(0, XI).filter(Boolean) as SoccerPlayer[];
    setResult(simulateTournament(xi));
    setPhase("sim");
  };

  const reset = () => {
    setAssignment(Array(TOTAL).fill(null));
    setResult(null);
    setSpinResult(null);
    setPhase("mode");
  };

  return (
    <div className="bg-grain">
      <div className="mb-6">
        <Link href="/" className="text-sm text-white/40 hover:text-white">
          ← Home
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-black">
          ⚽ <span className="text-soccer">Soccer</span> Mode
        </h1>
        <p className="text-sm text-white/50">Draft an all-time XI. Win the trophy.</p>
      </div>

      <AnimatePresence mode="wait">
        {phase === "mode" && (
          <motion.div key="mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ModePicker accent="soccer" onClassic={startClassic} onSpin={() => setPhase("spin")} />
          </motion.div>
        )}
        {phase === "spin" && (
          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SpinMachine sport="soccer" onComplete={(r) => onSpinComplete(r as SpinResult<SoccerPlayer>)} />
            <button onClick={() => setPhase("mode")} className="btn-ghost mx-auto mt-4 block">
              ← Back
            </button>
          </motion.div>
        )}
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Setup
              showSubMode={mode === "classic"}
              contextLabel={spinResult?.label ?? null}
              subMode={subMode}
              setSubMode={setSubMode}
              formationName={formationName}
              setFormationName={setFormationName}
              onNext={goToDraft}
              onBack={() => setPhase("mode")}
            />
          </motion.div>
        )}
        {phase === "draft" && (
          <motion.div key="draft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Draft
              formationName={formationName}
              assignment={assignment}
              setAssignment={setAssignment}
              hideStats={hideStats}
              pool={pool}
              lockedId={lockedId}
              contextLabel={spinResult?.label ?? null}
              onStart={start}
              onBack={() => setPhase("setup")}
            />
          </motion.div>
        )}
        {phase === "sim" && result && (
          <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TournamentSim result={result} onDone={() => setPhase("done")} />
          </motion.div>
        )}
        {phase === "done" && result && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TournamentResult
              result={result}
              xi={assignment.slice(0, XI).filter(Boolean) as SoccerPlayer[]}
              formationName={formationName}
              onReset={reset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- SETUP ----------------------------- */
function Setup({
  showSubMode,
  contextLabel,
  subMode,
  setSubMode,
  formationName,
  setFormationName,
  onNext,
  onBack,
}: {
  showSubMode: boolean;
  contextLabel: string | null;
  subMode: SubMode;
  setSubMode: (m: SubMode) => void;
  formationName: FormationName;
  setFormationName: (f: FormationName) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {contextLabel && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-2 text-sm">
          🎰 Drafting <span className="font-bold text-amber-300">{contextLabel}</span>
        </div>
      )}
      {showSubMode && (
        <div>
          <h2 className="mb-3 text-lg font-bold">1. Choose your challenge</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard active={subMode === "classic"} onClick={() => setSubMode("classic")} title="Classic" sub="Stats visible during the draft" emoji="📊" />
            <ChoiceCard active={subMode === "iq"} onClick={() => setSubMode("iq")} title="Soccer IQ" sub="Stats hidden — draft from memory" emoji="🧠" />
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold">{showSubMode ? "2." : ""} Pick a formation</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(FORMATIONS) as FormationName[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormationName(f)}
              className={`rounded-xl border p-4 text-center font-bold transition ${
                formationName === f
                  ? "border-soccer bg-soccer/10 text-soccer"
                  : "border-white/10 bg-panel text-white/70 hover:border-soccer/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="btn-ghost flex-1">
          ← Back
        </button>
        <button onClick={onNext} className="btn flex-1 bg-soccer text-black hover:bg-soccer-gold">
          Continue to draft →
        </button>
      </div>
    </div>
  );
}

function ChoiceCard({ active, onClick, title, sub, emoji }: { active: boolean; onClick: () => void; title: string; sub: string; emoji: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-5 text-left transition ${
        active ? "border-soccer bg-soccer/10" : "border-white/10 bg-panel hover:border-soccer/40"
      }`}
    >
      <div className="text-3xl">{emoji}</div>
      <div className="mt-2 font-bold">{title}</div>
      <div className="text-sm text-white/50">{sub}</div>
    </button>
  );
}

/* ----------------------------- DRAFT ----------------------------- */
function Draft({
  formationName,
  assignment,
  setAssignment,
  hideStats,
  pool,
  lockedId,
  contextLabel,
  onStart,
  onBack,
}: {
  formationName: FormationName;
  assignment: (SoccerPlayer | null)[];
  setAssignment: (v: (SoccerPlayer | null)[]) => void;
  hideStats: boolean;
  pool: SoccerPlayer[];
  lockedId: string | null;
  contextLabel: string | null;
  onStart: () => void;
  onBack: () => void;
}) {
  const formation = FORMATIONS[formationName];
  const [active, setActive] = useState<number>(() =>
    assignment.findIndex((x) => !x) === -1 ? 0 : assignment.findIndex((x) => !x)
  );
  const [query, setQuery] = useState("");

  const spent = assignment.reduce(
    (a, p) => a + (p && p.id !== lockedId ? p.cost : 0),
    0
  );
  const remaining = SOCCER_BUDGET - spent;
  const filled = assignment.filter(Boolean).length;
  const complete = filled === TOTAL;
  const selectedIds = new Set(assignment.filter(Boolean).map((p) => p!.id));

  const requiredPos: SoccerPosition | null =
    active < XI ? formation.slots[active].position : null;

  const visiblePool = useMemo(() => {
    return pool
      .filter((p) => (requiredPos ? p.position === requiredPos : true))
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.overall - a.overall);
  }, [pool, requiredPos, query]);

  const lockedActive = assignment[active]?.id === lockedId;

  const assign = (p: SoccerPlayer) => {
    if (lockedActive) return;
    if (selectedIds.has(p.id)) return;
    if (p.cost > remaining + (assignment[active]?.cost || 0)) return;
    const next = [...assignment];
    next[active] = p;
    setAssignment(next);
    const nextEmpty = next.findIndex((x, i) => i > active && !x);
    const anyEmpty = next.findIndex((x) => !x);
    setActive(nextEmpty !== -1 ? nextEmpty : anyEmpty !== -1 ? anyEmpty : active);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div>
        {contextLabel && (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs">
            🎰 <span className="font-bold text-amber-300">{contextLabel}</span> · star locked
          </div>
        )}
        <Pitch
          formation={formation}
          assignment={assignment.slice(0, XI)}
          hideStats={hideStats}
          onSlotClick={setActive}
          activeSlot={active < XI ? active : null}
        />

        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
            Substitutes
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((s) => {
              const idx = XI + s;
              const p = assignment[idx];
              return (
                <button
                  key={idx}
                  onClick={() => setActive(idx)}
                  className={`rounded-lg border p-2 text-center text-xs transition ${
                    active === idx
                      ? "border-soccer bg-soccer/10"
                      : p
                      ? "border-white/15 bg-panel"
                      : "border-dashed border-white/20 bg-panel/40 text-white/40"
                  }`}
                >
                  {p ? <span className="font-medium">{p.name.split(" ").slice(-1)[0]}</span> : "Sub"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <Budget remaining={remaining} />
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={onBack} className="btn-ghost flex-1">
            ← Back
          </button>
          <button
            onClick={onStart}
            disabled={!complete}
            className="btn flex-1 bg-soccer text-black hover:bg-soccer-gold"
          >
            {complete ? "Kick off tournament →" : `${TOTAL - filled} to fill`}
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="text-sm text-white/60">
            Picking:{" "}
            <span className="font-bold text-soccer">
              {lockedActive
                ? "🔒 Locked star (pick another slot)"
                : active < XI
                ? `${requiredPos} (slot ${active + 1})`
                : `Sub ${active - XI + 1} (any)`}
            </span>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="ml-auto w-36 rounded-lg border border-white/10 bg-panel px-3 py-1.5 text-sm outline-none focus:border-soccer/60"
          />
        </div>

        <div className="grid max-h-[560px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {visiblePool.map((p) => {
            const selected = selectedIds.has(p.id);
            const affordable = p.cost <= remaining + (assignment[active]?.cost || 0);
            const disabled = selected || !affordable || lockedActive;
            return (
              <button
                key={p.id}
                onClick={() => assign(p)}
                disabled={disabled}
                className={`rounded-xl border p-3 text-left transition ${
                  disabled
                    ? "border-white/5 bg-panel/40 opacity-40"
                    : "border-white/10 bg-panel hover:border-soccer/50 hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="text-xs text-white/40">
                      {p.position} · {p.country}
                    </div>
                  </div>
                  {!hideStats && (
                    <div className="text-right text-soccer-gold">
                      <div className="text-lg font-black leading-none">{p.overall}</div>
                    </div>
                  )}
                </div>
                {!hideStats && (
                  <div className="mt-2 grid grid-cols-4 gap-1 text-[11px] text-white/70">
                    <MiniStat label="PAC" value={p.pace} />
                    <MiniStat label="SHO" value={p.shooting} />
                    <MiniStat label="PAS" value={p.passing} />
                    <MiniStat label="DEF" value={p.defending} />
                  </div>
                )}
                <div className="mt-2 text-xs font-semibold text-soccer-gold">{p.cost} M</div>
              </button>
            );
          })}
          {visiblePool.length === 0 && (
            <div className="col-span-full rounded-xl border border-white/5 bg-panel/50 p-6 text-center text-sm text-white/40">
              No players available for this slot.
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-white/40">
          Tap a player on the pitch to replace them. The 🔒 locked star can&apos;t be removed.
        </div>
      </div>
    </div>
  );
}

function Budget({ remaining }: { remaining: number }) {
  const pct = Math.max(0, Math.min(100, (remaining / SOCCER_BUDGET) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>Budget</span>
        <span className={remaining < 0 ? "text-red-400" : "text-soccer-gold"}>
          {remaining}M left
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-soccer to-soccer-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-chip">
      <div className="font-semibold">{value}</div>
      <div className="text-[9px] text-white/40">{label}</div>
    </div>
  );
}

/* ----------------------------- SIM ----------------------------- */
function TournamentSim({
  result,
  onDone,
}: {
  result: SoccerTournamentResult;
  onDone: () => void;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= result.matches.length) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [shown, result.matches.length, onDone]);

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-center text-sm uppercase tracking-[0.3em] text-white/40">Tournament</p>
      <div className="mt-4 space-y-2">
        {result.matches.slice(0, shown).map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card p-4 ${m.win ? "border-soccer/40" : "border-red-500/40"}`}
          >
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>{m.round}</span>
              <span className={`font-bold ${m.win ? "text-soccer" : m.draw ? "text-white/60" : "text-red-400"}`}>
                {m.win ? "WIN" : m.draw ? "DRAW" : "OUT"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-2xl font-black tabular-nums">
              <span className="text-soccer">{m.teamGoals}</span>
              <span className="text-white/30">–</span>
              <span className="text-white/70">{m.oppGoals}</span>
            </div>
            <div className="mt-1 text-center text-sm text-white/50">
              Dynasty XI vs {m.opponent}
              {m.penalties && (
                <span className="ml-1 text-soccer-gold">
                  ({m.penalties.team}-{m.penalties.opp} pens)
                </span>
              )}
            </div>
            {m.scorers.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-white/50">
                {m.scorers.map((s, j) => (
                  <span key={j}>⚽ {s.name} {s.minute}&apos;</span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- RESULT ----------------------------- */
function TournamentResult({
  result,
  xi,
  formationName,
  onReset,
}: {
  result: SoccerTournamentResult;
  xi: SoccerPlayer[];
  formationName: FormationName;
  onReset: () => void;
}) {
  const { user, displayName, guestName, setGuestName } = useAuth();
  const [name, setName] = useState(displayName !== "Guest" ? displayName : guestName);
  const [saved, setSaved] = useState<"idle" | "saving" | "cloud" | "local">("idle");

  const save = async () => {
    if (!name.trim()) return;
    if (!user) setGuestName(name.trim());
    setSaved("saving");
    const res = await saveSoccerResult({
      username: name.trim(),
      result: result.reachedRound,
      players: xi.map((p) => p.name),
      formation: formationName,
      rating: result.teamRating,
    });
    setSaved(res.saved);
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      {result.champion && <Confetti />}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
      >
        <div className="text-7xl">{result.champion ? "🏆" : "⚽"}</div>
        <h2 className="mt-3 text-3xl font-black">
          {result.champion ? (
            <span className="text-soccer-gold">WORLD CHAMPIONS</span>
          ) : (
            `Eliminated: ${result.reachedRound}`
          )}
        </h2>
        <p className="mt-1 text-sm text-white/40">
          {formationName} · Team rating {result.teamRating}
        </p>
      </motion.div>

      <div className="card mt-6 p-4 text-left">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Your XI</div>
        <div className="flex flex-wrap gap-1.5">
          {xi.map((p) => (
            <span key={p.id} className="rounded-lg bg-white/5 px-2 py-1 text-xs">
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <div className="card mt-6 p-4">
        {saved === "cloud" || saved === "local" ? (
          <div className="text-sm">
            <p className="font-semibold text-soccer">Saved to leaderboard ✓</p>
            <p className="mt-1 text-white/40">
              {saved === "local"
                ? "Stored on this device. Sign in to save to the global board."
                : "Posted to the global leaderboard."}
            </p>
            <Link href="/leaderboard" className="btn-ghost mt-3 w-full">
              View leaderboard →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-sm outline-none focus:border-soccer/60"
            />
            <button
              onClick={save}
              disabled={!name.trim() || saved === "saving"}
              className="btn bg-soccer text-black hover:bg-soccer-gold"
            >
              {saved === "saving" ? "Saving…" : "Save result"}
            </button>
          </div>
        )}
        {!user && saved === "idle" && (
          <p className="mt-2 text-center text-xs text-white/40">
            Playing as guest ·{" "}
            <Link href="/login" className="text-soccer hover:underline">
              sign in
            </Link>{" "}
            to post to the global board.
          </p>
        )}
      </div>

      <button onClick={onReset} className="btn-ghost mt-4 w-full">
        Draft again ↺
      </button>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = ["#22c55e", "#fbbf24", "#ffffff", "#16a34a"];
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
