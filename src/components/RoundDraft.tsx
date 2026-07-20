"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Decade, DECADES } from "@/types";
import { Deck } from "@/lib/draft/candidates";
import { CourtView, BenchRow, SlotDef, CourtPlayer } from "@/components/Court";
import { Portrait } from "@/components/Portrait";
import { StatTooltip } from "@/components/StatTooltip";
import { nbaHeadshotSources } from "@/lib/nba/headshots";
import { soccerHeadshotSources } from "@/lib/soccer/headshots";
import { mulberry32, dailySeed } from "@/lib/rng";

export type DraftMode = "classic" | "iq" | "daily" | "team";

type P = CourtPlayer & { name: string; overall: number };
type Card<T> = T & { ghost?: boolean };

const ROUND_SECONDS = 20;

interface Props<T extends P> {
  variant: "nba" | "soccer";
  accent: "nba" | "soccer";
  slots: SlotDef[];
  starterCount: number;
  benchCount: number;
  deck: Deck<T>;
  mode: DraftMode;
  /** Optional 20s-per-round countdown that auto-picks if time runs out. */
  timed?: boolean;
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
  timed = false,
  contextLabel,
  confirmLabel,
  onConfirm,
  onExit,
}: Props<T>) {
  const accentBg = accent === "nba" ? "bg-nba" : "bg-soccer";
  const accentText = accent === "nba" ? "text-nba" : "text-soccer";
  const hideStats = mode === "iq";
  const decoysEnabled = mode === "iq"; // ghost cards only in the harder IQ modes
  const allowSkips = mode === "classic" || mode === "iq";

  const [placed, setPlaced] = useState<(Card<T> | null)[]>(() => Array(slots.length).fill(null));
  const [roundIndex, setRoundIndex] = useState(0);
  const [step, setStep] = useState<Step>(mode === "team" ? "select" : "spin");
  const [decade, setDecade] = useState<Decade>(DECADES[0]);
  const [team, setTeam] = useState<string>(deck.teams[0]);
  const [label, setLabel] = useState<string>("");
  const [candidates, setCandidates] = useState<Card<T>[]>([]);
  const [pending, setPending] = useState<Card<T> | null>(null);
  const [leftover, setLeftover] = useState<Card<T>[]>([]);
  const [skips, setSkips] = useState({ team: 1, era: 1 });
  const [shakeSlot, setShakeSlot] = useState<number | null>(null);

  // hidden-stats peek (IQ mode): reveals one card's stats for 2s
  const [peekId, setPeekId] = useState<string | null>(null);
  const peekTimer = useRef<ReturnType<typeof setTimeout>>();

  // per-round countdown (timer mode)
  const [remaining, setRemaining] = useState(ROUND_SECONDS);

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

  const computeCandidates = (d: Decade, t: string): Card<T>[] => {
    const base = deck.candidates(d, t, placedIds, openStarterPositions()) as Card<T>[];
    // In harder modes, secretly flag one card as a ghost (inflated display, weak in sim).
    if (!decoysEnabled || base.length < 2) return base;
    const ghostIdx = Math.floor(rng.current() * base.length);
    return base.map((c, i) => (i === ghostIdx ? { ...c, ghost: true } : c));
  };

  // keep latest candidates + pick handler reachable from the timer interval
  const candidatesRef = useRef<Card<T>[]>([]);
  const pickRef = useRef<(p: Card<T>) => void>(() => {});
  useEffect(() => {
    candidatesRef.current = candidates;
  }, [candidates]);

  const peek = (id: string) => {
    if (!hideStats) return;
    setPeekId(id);
    clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => setPeekId(null), 2000);
  };
  useEffect(() => () => clearTimeout(peekTimer.current), []);

  // Team Draft: make sure the initial team is one that exists in the decade
  useEffect(() => {
    if (mode !== "team") return;
    const opts = deck.iconicTeamsIn(decade);
    if (opts.length && !opts.includes(team)) setTeam(opts[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // 20s round timer: shrink, then auto-pick a random card when it hits zero
  useEffect(() => {
    if (!timed || step !== "reveal" || candidates.length === 0) return;
    setRemaining(ROUND_SECONDS);
    const start = Date.now();
    const iv = setInterval(() => {
      const left = ROUND_SECONDS - (Date.now() - start) / 1000;
      if (left <= 0) {
        clearInterval(iv);
        setRemaining(0);
        const pool = candidatesRef.current;
        if (pool.length) pickRef.current(pool[Math.floor(rng.current() * pool.length)]);
      } else {
        setRemaining(left);
      }
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, step, roundIndex]);

  /* ---------- spin ---------- */
  const doSpin = () => {
    if (spinning) return;
    const r = rng.current;
    // re-roll until we land on a team that can actually fill an open slot
    let result = deck.spin(r);
    let cands = computeCandidates(result.decade, result.team);
    for (let i = 0; i < 40 && cands.length === 0; i++) {
      result = deck.spin(r);
      cands = computeCandidates(result.decade, result.team);
    }
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
        setCandidates(cands);
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
    // only real teams from this decade that can still fill an open slot
    const opts = shuffle(
      deck.iconicTeamsIn(decade).filter((t) => t !== team),
      r
    );
    const t = opts.find((x) => computeCandidates(decade, x).length > 0);
    if (!t) return;
    setTeam(t);
    setReelTeam(t);
    setLabel(deck.labelFor(decade, t));
    setCandidates(computeCandidates(decade, t));
    setSkips((s) => ({ ...s, team: s.team - 1 }));
  };

  const reSpinKeepTeam = () => {
    if (skips.era <= 0) return;
    const r = rng.current;
    // only decades where this team actually existed and can fill an open slot
    const opts = shuffle(
      DECADES.filter((d) => d !== decade && deck.iconicTeamsIn(d).includes(team)),
      r
    );
    const d = opts.find((x) => computeCandidates(x, team).length > 0);
    if (!d) return;
    setDecade(d);
    setReelDecade(d);
    setLabel(deck.labelFor(d, team));
    setCandidates(computeCandidates(d, team));
    setSkips((s) => ({ ...s, era: s.era - 1 }));
  };

  /* ---------- pick + place ---------- */
  const pickCard = (p: Card<T>) => {
    setPeekId(null);
    clearTimeout(peekTimer.current);
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
  pickRef.current = pickCard;

  const commitPlace = (i: number, p: Card<T>) => {
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
  const benchPlace = (p: Card<T>) => {
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
                  onChange={(e) => {
                    const d = e.target.value as Decade;
                    setDecade(d);
                    const opts = deck.iconicTeamsIn(d);
                    if (opts.length && !opts.includes(team)) setTeam(opts[0]);
                  }}
                  className="rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm"
                >
                  {DECADES.filter((d) => deck.iconicTeamsIn(d).length > 0).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm"
                >
                  {deck.iconicTeamsIn(decade).map((t) => (
                    <option key={t} value={t}>{deck.labelFor(decade, t)}</option>
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
              <div className="mb-2 flex items-center justify-between text-sm">
                <div>
                  <span className={`font-bold ${accentText}`}>{label}</span>{" "}
                  <span className="text-white/40">
                    {step === "place" ? `· choose a slot for ${pending?.name}` : "· pick one player"}
                  </span>
                </div>
                {hideStats && step === "reveal" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/30">
                    👁 tap to peek
                  </span>
                )}
              </div>

              {timed && step === "reveal" && <TimerBar remaining={remaining} />}

              {candidates.length === 0 && (
                <div className="rounded-xl border border-white/5 bg-panel/40 p-5 text-center text-sm text-white/50">
                  No {label} players fit your open slots.{" "}
                  {mode === "team" ? "Pick another team or decade above." : "Use a skip or spin again."}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                {candidates.map((p, idx) => (
                  <CandidateCard
                    key={p.id}
                    p={p}
                    bars={deck.statBars(p)}
                    roles={deck.roles(p)}
                    accent={accent}
                    revealed={!hideStats || peekId === p.id}
                    dim={step === "place" && pending?.id !== p.id}
                    chosen={pending?.id === p.id}
                    onClick={() => {
                      if (step !== "reveal") return;
                      if (hideStats) peek(p.id);
                      else pickCard(p);
                    }}
                    onHover={hideStats && step === "reveal" ? () => peek(p.id) : undefined}
                    showDraft={step === "reveal" && hideStats}
                    onDraft={() => pickCard(p)}
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
                    revealed={!hideStats}
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

/* ----------------------------- timer bar ----------------------------- */
function TimerBar({ remaining }: { remaining: number }) {
  const urgent = remaining <= 5;
  const pct = Math.max(0, Math.min(100, (remaining / ROUND_SECONDS) * 100));
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide">
        <span className="text-white/30">⏱ Round timer</span>
        <span className={urgent ? "text-red-400" : "text-white/40"}>{Math.ceil(remaining)}s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
            urgent ? "bg-red-500 timer-pulse" : "bg-gradient-to-r from-amber-400 to-amber-200"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ----------------------------- candidate card ----------------------------- */
function CandidateCard({
  p,
  bars,
  roles,
  accent,
  revealed,
  dim,
  chosen,
  onClick,
  onHover,
  delay,
  compact,
  showDraft,
  onDraft,
}: {
  p: P & { ghost?: boolean };
  bars: { label: string; value: number }[];
  roles: string[];
  accent: "nba" | "soccer";
  revealed: boolean;
  dim: boolean;
  chosen: boolean;
  onClick: () => void;
  onHover?: () => void;
  delay: number;
  compact?: boolean;
  showDraft?: boolean;
  onDraft?: () => void;
}) {
  const barColor = accent === "nba" ? "from-nba to-nba-gold" : "from-soccer to-soccer-gold";
  const ring = accent === "nba" ? "ring-nba" : "ring-soccer";
  const ghost = !!p.ghost;
  // ghosts flash inflated stats to deceive — real value is used in the sim
  const dispOvr = ghost ? Math.min(99, p.overall + 7) : p.overall;
  const dispBars = ghost
    ? bars.map((b) => ({ ...b, value: Math.min(100, Math.round(b.value * 1.18)) }))
    : bars;
  return (
    <motion.div
      role="button"
      tabIndex={0}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: dim ? 0.45 : 1 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 14 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onPointerEnter={onHover}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`relative cursor-pointer select-none overflow-hidden rounded-xl border p-2.5 text-left transition ${
        chosen ? `border-amber-400 ring-2 ${ring}/40 bg-white/5` : "border-white/10 bg-panel hover:border-white/30"
      } ${ghost ? "ghost-shimmer" : ""}`}
    >
      <div className="flex items-center gap-2">
        <Portrait
          sources={accent === "nba" ? nbaHeadshotSources(p) : soccerHeadshotSources(p)}
          name={p.name}
          className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-white/15 to-white/5 text-[10px] font-black text-white/80"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">{p.name}</div>
          {revealed && (
            <div className={`text-[10px] font-bold ${accent === "nba" ? "text-nba" : "text-soccer"}`}>
              {dispOvr} OVR
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
      {revealed && !compact && (
        <div className="mt-2 space-y-1">
          {dispBars.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5">
              <StatTooltip abbr={b.label} className="w-7 text-[8px] font-semibold uppercase text-white/40" />
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
      {showDraft && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDraft?.();
          }}
          className={`mt-2 w-full rounded-lg py-1 text-[11px] font-bold text-black ${
            accent === "nba" ? "bg-nba hover:bg-nba-gold" : "bg-soccer hover:bg-soccer-gold"
          }`}
        >
          Draft
        </button>
      )}
    </motion.div>
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

function shuffle<X>(arr: X[], rng: () => number): X[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
