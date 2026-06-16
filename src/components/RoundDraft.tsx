"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Decade, DECADES } from "@/types";
import { Deck } from "@/lib/draft/candidates";
import { CourtView, BenchRow, SlotDef, CourtPlayer } from "@/components/Court";
import { mulberry32, dailySeed } from "@/lib/rng";

export type DraftMode = "classic" | "iq" | "daily" | "team";

type P = CourtPlayer & { name: string; overall: number };

interface Props<T extends P> {
  variant: "nba" | "soccer";
  accent: "nba" | "soccer";
  slots: SlotDef[];
  starterCount: number;
  benchCount: number;
  deck: Deck<T>;
  mode: DraftMode;
  contextLabel?: string;
  confirmLabel: string;
  onConfirm: (placed: (T | null)[]) => void;
  onExit: () => void;
}

type Step = "spin" | "select" | "reveal" | "place" | "bench";

export function RoundDraft<T extends P>({
  variant,
  accent,
  slots,
  starterCount,
  benchCount,
  deck,
  mode,
  contextLabel,
  confirmLabel,
  onConfirm,
  onExit,
}: Props<T>) {
  const accentBg = accent === "nba" ? "bg-nba" : "bg-soccer";
  const accentText = accent === "nba" ? "text-nba" : "text-soccer";
  const hideStats = mode === "iq";
  const allowSkips = mode === "classic" || mode === "iq";

  const [placed, setPlaced] = useState<(T | null)[]>(() => Array(slots.length).fill(null));
  const [roundIndex, setRoundIndex] = useState(0);
  const [step, setStep] = useState<Step>(mode === "team" ? "select" : "spin");
  const [decade, setDecade] = useState<Decade>(DECADES[0]);
  const [team, setTeam] = useState<string>(deck.teams[0]);
  const [label, setLabel] = useState<string>("");
  const [candidates, setCandidates] = useState<T[]>([]);
  const [pending, setPending] = useState<T | null>(null);
  const [leftover, setLeftover] = useState<T[]>([]);
  const [skips, setSkips] = useState({ team: 1, era: 1 });
  const [shakeSlot, setShakeSlot] = useState<number | null>(null);

  // reel animation
  const [spinning, setSpinning] = useState(false);
  const [reelDecade, setReelDecade] = useState<string>(DECADES[0]);
  const [reelTeam, setReelTeam] = useState<string>(deck.teams[0]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const rng = useRef<() => number>(mode === "daily" ? mulberry32(dailySeed()) : Math.random);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const placedIds = useMemo(
    () => new Set(placed.filter(Boolean).map((p) => p!.id)),
    [placed]
  );
  const starterIdx = slots.map((s, i) => ({ s, i })).filter(({ s }) => !s.bench);
  const benchIdx = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.bench);

  const openStarterPositions = (): Set<string> => {
    const set = new Set<string>();
    for (const { s, i } of starterIdx) if (placed[i] == null) set.add(s.position);
    return set;
  };

  const eligibleOpenSlots = (p: T): number[] =>
    starterIdx
      .filter(
        ({ s, i }) =>
          placed[i] == null &&
          (s.position === "ANY" || deck.eligible(p).includes(s.position))
      )
      .map(({ i }) => i);

  const computeCandidates = (d: Decade, t: string) =>
    deck.candidates(d, t, placedIds, openStarterPositions());

  /* ---------- spin ---------- */
  const doSpin = () => {
    if (spinning) return;
    const r = rng.current;
    const result = deck.spin(r);
    setSpinning(true);
    setPending(null);

    const di = setInterval(
      () => setReelDecade(DECADES[Math.floor(Math.random() * DECADES.length)]),
      80
    );
    const ti = setInterval(
      () => setReelTeam(deck.teams[Math.floor(Math.random() * deck.teams.length)]),
      60
    );
    timers.current.push(
      setTimeout(() => {
        clearInterval(di);
        setReelDecade(result.decade);
      }, 1400)
    );
    timers.current.push(
      setTimeout(() => {
        clearInterval(ti);
        setReelTeam(result.team);
        setDecade(result.decade);
        setTeam(result.team);
        setLabel(result.label);
        setCandidates(computeCandidates(result.decade, result.team));
        setSpinning(false);
        setStep("reveal");
      }, 2300)
    );
  };

  const doSelect = () => {
    setLabel(deck.labelFor(decade, team));
    setCandidates(computeCandidates(decade, team));
    setStep("reveal");
  };

  const reSpinKeepDecade = () => {
    if (skips.team <= 0) return;
    const r = rng.current;
    const inDecade = deck.iconicTeamsIn(decade);
    const t =
      inDecade.length && r() < 0.6
        ? inDecade[Math.floor(r() * inDecade.length)]
        : deck.teams[Math.floor(r() * deck.teams.length)];
    setTeam(t);
    setReelTeam(t);
    setLabel(deck.labelFor(decade, t));
    setCandidates(computeCandidates(decade, t));
    setSkips((s) => ({ ...s, team: s.team - 1 }));
  };

  const reSpinKeepTeam = () => {
    if (skips.era <= 0) return;
    const r = rng.current;
    const d = DECADES[Math.floor(r() * DECADES.length)];
    setDecade(d);
    setReelDecade(d);
    setLabel(deck.labelFor(d, team));
    setCandidates(computeCandidates(d, team));
    setSkips((s) => ({ ...s, era: s.era - 1 }));
  };

  /* ---------- pick + place ---------- */
  const pickCard = (p: T) => {
    // unchosen cards go to the bench/leftover pool
    const others = candidates.filter((c) => c.id !== p.id);
    setLeftover((prev) => {
      const seen = new Set(prev.map((x) => x.id));
      const add = others.filter((x) => !seen.has(x.id) && !placedIds.has(x.id));
      return [...prev, ...add];
    });

    const open = eligibleOpenSlots(p);
    if (open.length === 1) {
      commitPlace(open[0], p);
    } else {
      setPending(p);
      setStep("place");
    }
  };

  const commitPlace = (i: number, p: T) => {
    setPlaced((prev) => {
      const next = [...prev];
      next[i] = p;
      return next;
    });
    setPending(null);
    advanceRound();
  };

  const advanceRound = () => {
    const r = roundIndex + 1;
    setRoundIndex(r);
    if (r >= starterCount) {
      setStep("bench");
    } else {
      setStep(mode === "team" ? "select" : "spin");
      setCandidates([]);
    }
  };

  const triggerShake = (i: number) => {
    setShakeSlot(i);
    setTimeout(() => setShakeSlot(null), 450);
  };

  /* ---------- slot clicks ---------- */
  const highlight = useMemo<Set<number>>(() => {
    if (step === "place" && pending) return new Set(eligibleOpenSlots(pending));
    if (step === "bench") return new Set(benchIdx.filter(({ i }) => placed[i] == null).map(({ i }) => i));
    return new Set();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pending, placed]);

  const clickSlot = (i: number) => {
    if (step === "place" && pending) {
      if (highlight.has(i)) commitPlace(i, pending);
      else triggerShake(i);
      return;
    }
    if (step === "bench") {
      const occ = placed[i];
      if (occ && slots[i].bench) {
        // remove from bench back to pool
        setPlaced((prev) => {
          const next = [...prev];
          next[i] = null;
          return next;
        });
      }
    }
  };

  const benchPool = leftover.filter((p) => !placedIds.has(p.id));
  const benchPlace = (p: T) => {
    const slot = benchIdx.find(({ i }) => placed[i] == null);
    if (!slot) return;
    setPlaced((prev) => {
      const next = [...prev];
      next[slot.i] = p;
      return next;
    });
  };

  const benchFilled = benchIdx.every(({ i }) => placed[i] != null);
  const complete = placed.every((p) => p != null);

  const progress = Math.min(roundIndex, starterCount);

  return (
    <div>
      {/* header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          {contextLabel && (
            <div className="text-xs text-white/40">{contextLabel}</div>
          )}
          <div className="text-sm font-bold">
            {step === "bench" ? (
              <>Bench picks · {benchIdx.filter(({ i }) => placed[i]).length}/{benchCount}</>
            ) : (
              <>
                Round {progress + 1}/{starterCount} · Starters
              </>
            )}
          </div>
          {leftover.length > 0 && step !== "bench" && (
            <div className="text-xs text-white/35">🪑 {leftover.length} in leftover pool</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {allowSkips && step !== "bench" && (
            <>
              <SkipBtn
                label={`Team skip (${skips.team})`}
                disabled={skips.team <= 0 || step === "spin" || step === "select"}
                onClick={reSpinKeepDecade}
              />
              <SkipBtn
                label={`Era skip (${skips.era})`}
                disabled={skips.era <= 0 || step === "spin" || step === "select"}
                onClick={reSpinKeepTeam}
              />
            </>
          )}
          <button onClick={onExit} className="rounded-lg px-2 py-1 text-xs text-white/40 hover:text-white">
            Exit
          </button>
        </div>
      </div>

      {/* progress bar */}
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${accentBg} transition-all`}
          style={{ width: `${((progress + (step === "bench" ? benchIdx.filter(({ i }) => placed[i]).length : 0)) / slots.length) * 100}%` }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ACTION */}
        <div className="order-1">
          {(step === "spin") && (
            <div className="text-center">
              <Reels spinning={spinning} decade={reelDecade} team={reelTeam} accent={accent} />
              {!spinning ? (
                <button onClick={doSpin} className={`btn mt-6 w-full ${accentBg} text-black hover:opacity-90`}>
                  🎰 Spin round {progress + 1}
                </button>
              ) : (
                <div className="mt-6 text-sm font-semibold text-white/50">Spinning…</div>
              )}
            </div>
          )}

          {step === "select" && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-white/60">Choose a decade & team</div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={decade}
                  onChange={(e) => setDecade(e.target.value as Decade)}
                  className="rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm"
                >
                  {DECADES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm"
                >
                  {deck.teams.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button onClick={doSelect} className={`btn w-full ${accentBg} text-black hover:opacity-90`}>
                Reveal players →
              </button>
            </div>
          )}

          {(step === "reveal" || step === "place") && (
            <div>
              <div className="mb-2 text-sm">
                <span className={`font-bold ${accentText}`}>{label}</span>{" "}
                <span className="text-white/40">
                  {step === "place" ? `· choose a slot for ${pending?.name}` : "· pick one player"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                {candidates.map((p, idx) => (
                  <CandidateCard
                    key={p.id}
                    p={p}
                    bars={deck.statBars(p)}
                    roles={deck.roles(p)}
                    accent={accent}
                    hideStats={hideStats}
                    dim={step === "place" && pending?.id !== p.id}
                    chosen={pending?.id === p.id}
                    onClick={() => step === "reveal" && pickCard(p)}
                    delay={idx * 0.07}
                  />
                ))}
              </div>
              {step === "place" && (
                <p className="mt-3 text-xs text-white/40">
                  This player can fill multiple positions — tap a highlighted slot on the court.
                </p>
              )}
            </div>
          )}

          {step === "bench" && (
            <div>
              <div className="mb-2 text-sm font-semibold text-white/60">
                Pick {benchCount} from your leftover pool ({benchPool.length} available)
              </div>
              <div className="grid max-h-[440px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {benchPool.map((p) => (
                  <CandidateCard
                    key={p.id}
                    p={p}
                    bars={deck.statBars(p)}
                    roles={deck.roles(p)}
                    accent={accent}
                    hideStats={hideStats}
                    dim={!benchFilled ? false : true}
                    chosen={false}
                    onClick={() => !benchFilled && benchPlace(p)}
                    delay={0}
                    compact
                  />
                ))}
                {benchPool.length === 0 && (
                  <div className="col-span-full rounded-xl border border-white/5 bg-panel/40 p-6 text-center text-sm text-white/40">
                    No leftover players.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* COURT */}
        <div className="order-2">
          <CourtView
            variant={variant}
            accent={accent}
            slots={slots}
            placed={placed}
            highlight={highlight}
            lockedId={null}
            shakeSlot={shakeSlot}
            onSlotClick={clickSlot}
          />
          <BenchRow
            variant={variant}
            accent={accent}
            slots={slots}
            placed={placed}
            highlight={highlight}
            lockedId={null}
            shakeSlot={shakeSlot}
            onSlotClick={clickSlot}
            label={variant === "nba" ? "Bench" : "Substitutes"}
          />
          <motion.button
            onClick={() => onConfirm(placed)}
            disabled={!complete}
            animate={complete ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={complete ? { repeat: Infinity, duration: 1.6 } : { duration: 0.2 }}
            className={`btn mt-4 w-full ${
              complete ? `${accentBg} text-black hover:opacity-90` : "cursor-default bg-white/5 text-white/40"
            }`}
          >
            {complete ? confirmLabel : "Draft in progress…"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- reels ----------------------------- */
function Reels({
  spinning,
  decade,
  team,
  accent,
}: {
  spinning: boolean;
  decade: string;
  team: string;
  accent: "nba" | "soccer";
}) {
  const border = accent === "nba" ? "border-nba" : "border-soccer";
  const text = accent === "nba" ? "text-nba" : "text-soccer";
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Decade", value: decade },
        { label: "Team", value: team },
      ].map((r) => (
        <div key={r.label}>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            {r.label}
          </div>
          <div
            className={`relative flex h-20 items-center justify-center overflow-hidden rounded-xl border-2 bg-panel px-2 ${
              spinning ? "border-white/10" : `${border} shadow-[0_0_22px_-6px] shadow-white/20`
            }`}
          >
            <motion.span
              key={r.value}
              initial={{ y: -14, opacity: 0.4 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.08 }}
              className={`text-center text-lg font-black leading-tight ${spinning ? "text-white/70" : text}`}
            >
              {r.value}
            </motion.span>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-panel to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-panel to-transparent" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- candidate card ----------------------------- */
function CandidateCard({
  p,
  bars,
  roles,
  accent,
  hideStats,
  dim,
  chosen,
  onClick,
  delay,
  compact,
}: {
  p: P;
  bars: { label: string; value: number }[];
  roles: string[];
  accent: "nba" | "soccer";
  hideStats: boolean;
  dim: boolean;
  chosen: boolean;
  onClick: () => void;
  delay: number;
  compact?: boolean;
}) {
  const barColor = accent === "nba" ? "from-nba to-nba-gold" : "from-soccer to-soccer-gold";
  const ring = accent === "nba" ? "ring-nba" : "ring-soccer";
  return (
    <motion.button
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: dim ? 0.45 : 1 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 14 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`rounded-xl border p-2.5 text-left transition ${
        chosen ? `border-amber-400 ring-2 ${ring}/40 bg-white/5` : "border-white/10 bg-panel hover:border-white/30"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/5 text-[10px] font-black text-white/80">
          {initials(p.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">{p.name}</div>
          {!hideStats && (
            <div className={`text-[10px] font-bold ${accent === "nba" ? "text-nba" : "text-soccer"}`}>
              {p.overall} OVR
            </div>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {roles.map((r) => (
          <span key={r} className="rounded bg-white/10 px-1 py-0.5 text-[8px] font-bold tracking-wide text-white/70">
            {r}
          </span>
        ))}
      </div>
      {!hideStats && !compact && (
        <div className="mt-2 space-y-1">
          {bars.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5">
              <span className="w-7 text-[8px] font-semibold text-white/40">{b.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                  style={{ width: `${b.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.button>
  );
}

function SkipBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-white/10 px-2 py-1 text-xs font-semibold text-white/70 hover:bg-white/5 disabled:opacity-30"
    >
      {label}
    </button>
  );
}

function initials(name: string): string {
  const parts = name.split(" ");
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
}
