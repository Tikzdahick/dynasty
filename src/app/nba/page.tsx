"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  NBA_PLAYERS,
  NBA_SALARY_CAP,
  NBA_STARTERS,
  NBA_BENCH,
} from "@/lib/nba/players";
import { simulateSeason, teamRating } from "@/lib/nba/sim";
import { NbaPlayer, NbaPosition, NbaSeasonResult, SpinResult } from "@/types";
import { useAuth } from "@/lib/auth";
import { saveNbaResult } from "@/lib/store/leaderboard";
import { SpinMachine } from "@/components/SpinMachine";
import { ModePicker } from "@/components/ModePicker";
import { LineupBuilder, SlotDef } from "@/components/LineupBuilder";
import { nbaEligible, nbaRoles } from "@/lib/nba/eligibility";

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

const POSITIONS: (NbaPosition | "ALL")[] = ["ALL", "PG", "SG", "SF", "PF", "C"];

type Phase = "mode" | "spin" | "draft" | "sim" | "done";

export default function NbaPage() {
  const [phase, setPhase] = useState<Phase>("mode");
  const [starters, setStarters] = useState<NbaPlayer[]>([]);
  const [bench, setBench] = useState<NbaPlayer[]>([]);
  const [season, setSeason] = useState<NbaSeasonResult | null>(null);

  // spin draft state
  const [mode, setMode] = useState<"classic" | "spin">("classic");
  const [pool, setPool] = useState<NbaPlayer[]>(NBA_PLAYERS);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const [contextLabel, setContextLabel] = useState<string | null>(null);
  const [spinInitial, setSpinInitial] = useState<(NbaPlayer | null)[]>([]);

  const spent = useMemo(
    () =>
      [...starters, ...bench]
        .filter((p) => p.id !== lockedId)
        .reduce((a, p) => a + p.cost, 0),
    [starters, bench, lockedId]
  );
  const remaining = NBA_SALARY_CAP - spent;
  const rating = useMemo(() => teamRating(starters, bench), [starters, bench]);
  const rosterFull = starters.length === NBA_STARTERS && bench.length === NBA_BENCH;

  const startClassic = () => {
    setMode("classic");
    setPool(NBA_PLAYERS);
    setLockedId(null);
    setContextLabel(null);
    setStarters([]);
    setBench([]);
    setPhase("draft");
  };

  const onSpinComplete = (result: SpinResult<NbaPlayer>) => {
    const combined = [result.locked, ...result.teamPlayers, ...result.fillPlayers];
    const seen = new Set<string>();
    const deduped = combined.filter((p) =>
      seen.has(p.id) ? false : (seen.add(p.id), true)
    );
    setMode("spin");
    setPool(deduped);
    setLockedId(result.locked.id);
    setContextLabel(result.label);

    // pre-place the locked star in a natural eligible slot
    const initial: (NbaPlayer | null)[] = Array(NBA_SLOTS.length).fill(null);
    const elig = nbaEligible(result.locked) as string[];
    const slotIdx = NBA_SLOTS.findIndex((s) => s.position !== "ANY" && elig.includes(s.position));
    initial[slotIdx >= 0 ? slotIdx : 5] = result.locked;
    setSpinInitial(initial);
    setPhase("draft");
  };

  const startSeason = () => {
    setSeason(simulateSeason(rating));
    setPhase("sim");
  };

  const startSeasonFromLineup = (placed: (NbaPlayer | null)[]) => {
    const s = placed.slice(0, 5).filter(Boolean) as NbaPlayer[];
    const b = placed.slice(5, 8).filter(Boolean) as NbaPlayer[];
    setStarters(s);
    setBench(b);
    setSeason(simulateSeason(teamRating(s, b)));
    setPhase("sim");
  };

  const reset = () => {
    setStarters([]);
    setBench([]);
    setSeason(null);
    setLockedId(null);
    setContextLabel(null);
    setPhase("mode");
  };

  return (
    <div className="bg-grain">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-white/40 hover:text-white">
            ← Home
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-black">
            🏀 <span className="text-nba">NBA</span> Mode
          </h1>
          <p className="text-sm text-white/50">Draft 8 legends. Chase 82-0.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "mode" && (
          <motion.div key="mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ModePicker
              accent="nba"
              onClassic={startClassic}
              onSpin={() => setPhase("spin")}
            />
          </motion.div>
        )}
        {phase === "spin" && (
          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SpinMachine sport="nba" onComplete={(r) => onSpinComplete(r as SpinResult<NbaPlayer>)} />
            <button onClick={() => setPhase("mode")} className="btn-ghost mx-auto mt-4 block">
              ← Back
            </button>
          </motion.div>
        )}
        {phase === "draft" && mode === "spin" && (
          <motion.div key="lineup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LineupBuilder<NbaPlayer>
              variant="nba"
              accent="nba"
              slots={NBA_SLOTS}
              pool={pool}
              lockedId={lockedId}
              initialPlaced={spinInitial}
              eligible={nbaEligible}
              roles={nbaRoles}
              contextLabel={contextLabel}
              confirmLabel="Confirm lineup → Tip off"
              onConfirm={startSeasonFromLineup}
              onBack={() => setPhase("mode")}
            />
          </motion.div>
        )}
        {phase === "draft" && mode === "classic" && (
          <motion.div key="draft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DraftBoard
              pool={pool}
              lockedId={lockedId}
              contextLabel={contextLabel}
              starters={starters}
              bench={bench}
              setStarters={setStarters}
              setBench={setBench}
              remaining={remaining}
              rating={rating}
              rosterFull={rosterFull}
              onStart={startSeason}
              onBack={() => setPhase("mode")}
            />
          </motion.div>
        )}
        {phase === "sim" && season && (
          <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SeasonSim season={season} onDone={() => setPhase("done")} />
          </motion.div>
        )}
        {phase === "done" && season && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SeasonResult season={season} roster={[...starters, ...bench]} onReset={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- DRAFT ----------------------------- */
function DraftBoard({
  pool,
  lockedId,
  contextLabel,
  starters,
  bench,
  setStarters,
  setBench,
  remaining,
  rating,
  rosterFull,
  onStart,
  onBack,
}: {
  pool: NbaPlayer[];
  lockedId: string | null;
  contextLabel: string | null;
  starters: NbaPlayer[];
  bench: NbaPlayer[];
  setStarters: (v: NbaPlayer[]) => void;
  setBench: (v: NbaPlayer[]) => void;
  remaining: number;
  rating: number;
  rosterFull: boolean;
  onStart: () => void;
  onBack: () => void;
}) {
  const [pos, setPos] = useState<(typeof POSITIONS)[number]>("ALL");
  const [query, setQuery] = useState("");

  const selectedIds = new Set([...starters, ...bench].map((p) => p.id));

  const visiblePool = useMemo(() => {
    return pool
      .filter((p) => p.id !== lockedId)
      .filter((p) => (pos === "ALL" ? true : p.position === pos))
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.overall - a.overall);
  }, [pool, lockedId, pos, query]);

  const add = (p: NbaPlayer) => {
    if (selectedIds.has(p.id)) return;
    if (p.cost > remaining) return;
    if (starters.length < NBA_STARTERS) setStarters([...starters, p]);
    else if (bench.length < NBA_BENCH) setBench([...bench, p]);
  };

  const remove = (p: NbaPlayer) => {
    if (p.id === lockedId) return;
    setStarters(starters.filter((x) => x.id !== p.id));
    setBench(bench.filter((x) => x.id !== p.id));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        {contextLabel && (
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-2 text-sm">
            🎰 Drafting <span className="font-bold text-amber-300">{contextLabel}</span>{" "}
            <span className="text-white/40">· pick from this roster (+ decade fill)</span>
          </div>
        )}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPos(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                pos === p ? "bg-nba text-black" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players…"
            className="ml-auto w-40 rounded-lg border border-white/10 bg-panel px-3 py-1.5 text-sm outline-none focus:border-nba/60"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePool.map((p) => {
            const selected = selectedIds.has(p.id);
            const tooPricey = !selected && p.cost > remaining;
            return (
              <button
                key={p.id}
                onClick={() => (selected ? remove(p) : add(p))}
                disabled={tooPricey}
                className={`group rounded-xl border p-3 text-left transition ${
                  selected
                    ? "border-nba bg-nba/10"
                    : tooPricey
                    ? "border-white/5 bg-panel/50 opacity-40"
                    : "border-white/10 bg-panel hover:border-nba/50 hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold leading-tight">{p.name}</div>
                    <div className="text-xs text-white/40">
                      {p.position} · {p.era}
                    </div>
                  </div>
                  <RatingBadge value={p.overall} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 text-xs text-white/70">
                  <Stat label="PPG" value={p.ppg} />
                  <Stat label="RPG" value={p.rpg} />
                  <Stat label="APG" value={p.apg} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-nba-gold">{p.cost} pts</span>
                  <span className="text-white/40 group-hover:text-white">
                    {selected ? "Remove −" : "Draft +"}
                  </span>
                </div>
              </button>
            );
          })}
          {visiblePool.length === 0 && (
            <div className="col-span-full rounded-xl border border-white/5 bg-panel/50 p-6 text-center text-sm text-white/40">
              No players match.
            </div>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Your Roster</h3>
            <span className="rounded-lg bg-white/5 px-2 py-1 text-xs">
              OVR <span className="font-bold text-nba">{rating || "—"}</span>
            </span>
          </div>

          <div className="mt-3">
            <Cap remaining={remaining} />
          </div>

          <RosterGroup
            title={`Starters ${starters.length}/${NBA_STARTERS}`}
            players={starters}
            lockedId={lockedId}
            onRemove={remove}
            color="border-nba/40"
          />
          <RosterGroup
            title={`Bench ${bench.length}/${NBA_BENCH}`}
            players={bench}
            lockedId={lockedId}
            onRemove={remove}
            color="border-white/10"
          />

          <button
            onClick={onStart}
            disabled={!rosterFull}
            className="btn mt-4 w-full bg-nba text-black hover:bg-nba-gold"
          >
            {rosterFull
              ? "Start 82-Game Season →"
              : `Draft ${8 - starters.length - bench.length} more`}
          </button>
          <button onClick={onBack} className="btn-ghost mt-2 w-full text-sm">
            ← Change mode
          </button>
        </div>
      </aside>
    </div>
  );
}

function Cap({ remaining }: { remaining: number }) {
  const pct = Math.max(0, Math.min(100, (remaining / NBA_SALARY_CAP) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>Salary cap</span>
        <span className={remaining < 0 ? "text-red-400" : "text-nba-gold"}>
          {remaining} pts left
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-nba to-nba-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RosterGroup({
  title,
  players,
  lockedId,
  onRemove,
  color,
}: {
  title: string;
  players: NbaPlayer[];
  lockedId: string | null;
  onRemove: (p: NbaPlayer) => void;
  color: string;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
        {title}
      </div>
      <div className="space-y-1.5">
        {players.length === 0 && (
          <div className={`rounded-lg border border-dashed ${color} px-3 py-2 text-xs text-white/30`}>
            Empty
          </div>
        )}
        {players.map((p) => {
          const locked = p.id === lockedId;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                locked ? "border border-amber-400/50 bg-amber-400/10" : "bg-white/5"
              }`}
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {locked && "🔒 "}
                  {p.name}
                </div>
                <div className="text-xs text-white/40">
                  {p.position} · {locked ? "FREE" : `${p.cost} pts`}
                </div>
              </div>
              {!locked && (
                <button
                  onClick={() => onRemove(p)}
                  className="ml-2 text-white/30 hover:text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- SIM ----------------------------- */
function SeasonSim({
  season,
  onDone,
}: {
  season: NbaSeasonResult;
  onDone: () => void;
}) {
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
        <div
          className="h-full bg-gradient-to-r from-nba to-nba-gold transition-all"
          style={{ width: `${(shown / season.games.length) * 100}%` }}
        />
      </div>

      <div ref={listRef} className="card max-h-80 space-y-1.5 overflow-y-auto p-3 text-left">
        {games.map((g) => (
          <motion.div
            key={g.game}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
              g.win ? "bg-nba/10" : "bg-red-500/10"
            }`}
          >
            <span className="text-white/40">#{g.game}</span>
            <span className="flex-1 px-3 text-white/70">vs {g.opponent}</span>
            <span className="font-semibold tabular-nums">
              {g.teamScore}–{g.oppScore}
            </span>
            <span className={`ml-3 w-5 text-center font-bold ${g.win ? "text-nba" : "text-red-400"}`}>
              {g.win ? "W" : "L"}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- RESULT ----------------------------- */
function SeasonResult({
  season,
  roster,
  onReset,
}: {
  season: NbaSeasonResult;
  roster: NbaPlayer[];
  onReset: () => void;
}) {
  const { user, displayName, guestName, setGuestName } = useAuth();
  const [name, setName] = useState(displayName !== "Guest" ? displayName : guestName);
  const [saved, setSaved] = useState<"idle" | "saving" | "cloud" | "local">("idle");

  const undefeated = season.losses === 0;
  const elite = season.wins >= 70;

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
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
      >
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">Final record</p>
        <div className="my-3 text-7xl font-black tabular-nums">
          <span className="text-nba">{season.wins}</span>
          <span className="text-white/30">-</span>
          <span className="text-white/70">{season.losses}</span>
        </div>
        <p className="text-lg font-semibold">
          {undefeated
            ? "🏆 PERFECT SEASON — 82-0! Immortal."
            : elite
            ? "🔥 Historic season. Title contender."
            : season.wins >= 50
            ? "Solid playoff team."
            : "Better luck next draft."}
        </p>
        <p className="mt-1 text-sm text-white/40">Team rating {season.teamRating}</p>
      </motion.div>

      <div className="card mt-6 p-4 text-left">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
          Your roster
        </div>
        <div className="flex flex-wrap gap-1.5">
          {roster.map((p) => (
            <span key={p.id} className="rounded-lg bg-white/5 px-2 py-1 text-xs">
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <div className="card mt-6 p-4">
        {saved === "cloud" || saved === "local" ? (
          <div className="text-sm">
            <p className="font-semibold text-nba">Saved to leaderboard ✓</p>
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
              className="flex-1 rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-sm outline-none focus:border-nba/60"
            />
            <button
              onClick={save}
              disabled={!name.trim() || saved === "saving"}
              className="btn bg-nba text-black hover:bg-nba-gold"
            >
              {saved === "saving" ? "Saving…" : "Save result"}
            </button>
          </div>
        )}
        {!user && saved === "idle" && (
          <p className="mt-2 text-center text-xs text-white/40">
            Playing as guest ·{" "}
            <Link href="/login" className="text-nba hover:underline">
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

/* ----------------------------- shared bits ----------------------------- */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-chip">
      <div className="font-semibold">{value}</div>
      <div className="text-[10px] text-white/40">{label}</div>
    </div>
  );
}

function RatingBadge({ value }: { value: number }) {
  const color = value >= 95 ? "text-nba-gold" : value >= 90 ? "text-nba" : "text-white/70";
  return (
    <div className={`text-right ${color}`}>
      <div className="text-xl font-black leading-none">{value}</div>
      <div className="text-[10px] uppercase text-white/30">OVR</div>
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
