"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export interface BuilderPlayer {
  id: string;
  name: string;
  overall: number;
  position: string;
}

export interface SlotDef {
  id: string;
  position: string; // coarse position or "ANY"
  label: string;
  x?: number; // % across court (court slots only)
  y?: number; // % up court
  bench?: boolean;
}

interface Props<P extends BuilderPlayer> {
  variant: "nba" | "soccer";
  accent: "nba" | "soccer";
  slots: SlotDef[];
  pool: P[];
  lockedId: string | null;
  initialPlaced: (P | null)[];
  eligible: (p: P) => string[];
  roles: (p: P) => string[];
  contextLabel?: string | null;
  hideRatings?: boolean;
  confirmLabel: string;
  onConfirm: (placed: (P | null)[]) => void;
  onBack: () => void;
}

const ACCENT = {
  nba: { text: "text-nba", bg: "bg-nba", border: "border-nba", ring: "ring-nba" },
  soccer: { text: "text-soccer", bg: "bg-soccer", border: "border-soccer", ring: "ring-soccer" },
};

export function LineupBuilder<P extends BuilderPlayer>({
  variant,
  accent,
  slots,
  pool,
  lockedId,
  initialPlaced,
  eligible,
  roles,
  contextLabel,
  hideRatings,
  confirmLabel,
  onConfirm,
  onBack,
}: Props<P>) {
  const a = ACCENT[accent];
  const [placed, setPlaced] = useState<(P | null)[]>(initialPlaced);
  const [selected, setSelected] = useState<P | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [shake, setShake] = useState<number | null>(null);

  const placedIds = new Set(placed.filter(Boolean).map((p) => p!.id));
  // The locked anchor never appears as a free card — it only lives in slots.
  const available = pool.filter((p) => !placedIds.has(p.id) && p.id !== lockedId);
  const lockedPlaced = lockedId == null || placed.some((p) => p?.id === lockedId);
  const lockedFloating = !!selected && selected.id === lockedId;
  const complete = placed.every((p) => p !== null) && lockedPlaced;

  const isLocked = (p: P | null) => !!p && p.id === lockedId;
  const slotEligible = (p: P, slot: SlotDef) =>
    slot.position === "ANY" || eligible(p).includes(slot.position);

  const triggerShake = (i: number) => {
    setShake(i);
    setTimeout(() => setShake(null), 450);
  };

  const selectPlayer = (p: P) => {
    // While the locked star is in hand it must be placed before doing anything else.
    if (lockedFloating) return;
    if (selected?.id === p.id) {
      setSelected(null);
      return;
    }
    setSelected(p);
  };

  const placeInto = (i: number) => {
    if (!selected) {
      // pick up an occupant
      const occ = placed[i];
      if (!occ) return;
      const next = [...placed];
      next[i] = null;
      setPlaced(next);
      setSelected(occ);
      return;
    }
    const slot = slots[i];
    if (!slotEligible(selected, slot)) {
      triggerShake(i);
      return;
    }
    const occupant = placed[i];
    if (occupant && isLocked(occupant)) {
      triggerShake(i);
      return;
    }
    const next = [...placed];
    // remove selected from anywhere it might still be
    for (let k = 0; k < next.length; k++) if (next[k]?.id === selected.id) next[k] = null;
    next[i] = selected;
    setPlaced(next);
    setSelected(null);
  };

  // drag handlers
  const onDragStartCard = (p: P) => {
    if (lockedFloating) return;
    setSelected(p);
  };
  const onDropSlot = (i: number) => {
    placeInto(i);
    setHoverSlot(null);
  };

  const courtSlots = slots.map((s, i) => ({ s, i })).filter(({ s }) => !s.bench);
  const benchSlots = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.bench);

  return (
    <div>
      {contextLabel && (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-2 text-sm">
          🎰 <span className="font-bold text-amber-300">{contextLabel}</span>{" "}
          <span className="text-white/40">· build your lineup</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        {/* LEFT — available players */}
        <div className="order-2 lg:order-1">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/50">
              Available · {available.length}
            </h3>
            {selected && (
              <span className={`text-xs font-semibold ${a.text}`}>
                {isLocked(selected) ? "🔒 " : ""}
                {selected.name} selected → tap a slot
              </span>
            )}
          </div>
          <div className="grid max-h-[460px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {available.map((p) => (
              <PlayerCard
                key={p.id}
                p={p}
                roles={roles(p)}
                selected={selected?.id === p.id}
                accent={accent}
                hideRatings={hideRatings}
                onClick={() => selectPlayer(p)}
                onDragStart={() => onDragStartCard(p)}
              />
            ))}
            {available.length === 0 && (
              <div className="col-span-full rounded-xl border border-white/5 bg-panel/50 p-6 text-center text-sm text-white/40">
                All players placed.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — court / pitch */}
        <div className="order-1 lg:order-2">
          {variant === "soccer" ? (
            <SoccerCourt
              courtSlots={courtSlots}
              placed={placed}
              selected={selected}
              hoverSlot={hoverSlot}
              shake={shake}
              accent={accent}
              isLocked={isLocked}
              slotEligible={(p, s) => slotEligible(p, s)}
              setHoverSlot={setHoverSlot}
              onDropSlot={onDropSlot}
              onClickSlot={placeInto}
            />
          ) : (
            <NbaCourt
              courtSlots={courtSlots}
              placed={placed}
              selected={selected}
              hoverSlot={hoverSlot}
              shake={shake}
              accent={accent}
              isLocked={isLocked}
              slotEligible={(p, s) => slotEligible(p, s)}
              setHoverSlot={setHoverSlot}
              onDropSlot={onDropSlot}
              onClickSlot={placeInto}
            />
          )}

          {/* bench / subs row */}
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
              {variant === "nba" ? "Bench" : "Substitutes"} · any position
            </div>
            <div className="grid grid-cols-3 gap-2">
              {benchSlots.map(({ s, i }) => (
                <BenchSlot
                  key={s.id}
                  slot={s}
                  player={placed[i]}
                  accent={accent}
                  selected={selected}
                  shake={shake === i}
                  isLocked={isLocked(placed[i])}
                  onClick={() => placeInto(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoverSlot(i);
                  }}
                  onDrop={() => onDropSlot(i)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={onBack} className="btn-ghost flex-1">
              ← Back
            </button>
            <button
              onClick={() => onConfirm(placed)}
              disabled={!complete}
              className={`btn flex-1 ${a.bg} text-black hover:opacity-90`}
            >
              {complete ? confirmLabel : `Fill all slots (${placed.filter(Boolean).length}/${slots.length})`}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-white/35">
            Drag a card onto a slot, or tap a card then tap a slot. The 🔒 star
            can move to eligible slots but can&apos;t be removed.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- player card ----------------------------- */
function PlayerCard<P extends BuilderPlayer>({
  p,
  roles,
  selected,
  accent,
  hideRatings,
  onClick,
  onDragStart,
}: {
  p: P;
  roles: string[];
  selected: boolean;
  accent: "nba" | "soccer";
  hideRatings?: boolean;
  onClick: () => void;
  onDragStart: () => void;
}) {
  const a = ACCENT[accent];
  return (
    <motion.button
      layout
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`rounded-xl border p-2.5 text-left transition ${
        selected
          ? `${a.border} bg-white/5 ring-2 ${a.ring}/40`
          : "border-white/10 bg-panel hover:-translate-y-0.5 hover:border-white/25"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/5 text-[11px] font-black text-white/80">
          {initials(p.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">{p.name}</div>
          {!hideRatings && (
            <div className={`text-[11px] font-bold ${a.text}`}>{p.overall} OVR</div>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {roles.map((r) => (
          <span
            key={r}
            className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white/70"
          >
            {r}
          </span>
        ))}
      </div>
    </motion.button>
  );
}

/* ----------------------------- soccer pitch ----------------------------- */
function SoccerCourt<P extends BuilderPlayer>(props: CourtProps<P>) {
  const { courtSlots } = props;
  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-white/10">
      <div className="absolute inset-0 bg-gradient-to-b from-green-900 to-green-950" />
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`absolute left-0 right-0 ${i % 2 ? "bg-white/[0.03]" : ""}`}
          style={{ top: `${(i / 6) * 100}%`, height: `${100 / 6}%` }}
        />
      ))}
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/15" />
      <div className="absolute left-1/2 top-0 h-14 w-32 -translate-x-1/2 border-x border-b border-white/15" />
      <div className="absolute bottom-0 left-1/2 h-14 w-32 -translate-x-1/2 border-x border-t border-white/15" />
      <CourtSlots {...props} useCoords />
      {void courtSlots}
    </div>
  );
}

/* ----------------------------- nba half court ----------------------------- */
function NbaCourt<P extends BuilderPlayer>(props: CourtProps<P>) {
  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#3a2417] to-[#241208]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none">
          {/* hoop + backboard at top */}
          <line x1="42" y1="6" x2="58" y2="6" />
          <circle cx="50" cy="9" r="2" />
          {/* paint */}
          <rect x="38" y="6" width="24" height="34" />
          {/* free-throw circle */}
          <circle cx="50" cy="40" r="10" />
          {/* three-point arc */}
          <path d="M16 6 L16 26 A40 40 0 0 0 84 26 L84 6" />
          {/* half-court line */}
          <line x1="2" y1="98" x2="98" y2="98" />
        </g>
      </svg>
      <CourtSlots {...props} useCoords />
    </div>
  );
}

interface CourtProps<P extends BuilderPlayer> {
  courtSlots: { s: SlotDef; i: number }[];
  placed: (P | null)[];
  selected: P | null;
  hoverSlot: number | null;
  shake: number | null;
  accent: "nba" | "soccer";
  isLocked: (p: P | null) => boolean;
  slotEligible: (p: P, s: SlotDef) => boolean;
  setHoverSlot: (i: number | null) => void;
  onDropSlot: (i: number) => void;
  onClickSlot: (i: number) => void;
  useCoords?: boolean;
}

function CourtSlots<P extends BuilderPlayer>({
  courtSlots,
  placed,
  selected,
  hoverSlot,
  shake,
  accent,
  isLocked,
  slotEligible,
  setHoverSlot,
  onDropSlot,
  onClickSlot,
}: CourtProps<P>) {
  const a = ACCENT[accent];
  return (
    <>
      {courtSlots.map(({ s, i }) => {
        const player = placed[i];
        const hovering = hoverSlot === i && selected;
        const eligibleHover = hovering ? slotEligible(selected!, s) : false;
        const locked = isLocked(player);
        return (
          <motion.button
            key={s.id}
            onClick={() => onClickSlot(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setHoverSlot(i);
            }}
            onDragLeave={() => setHoverSlot(null)}
            onDrop={() => onDropSlot(i)}
            animate={shake === i ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${s.x}%`, top: `${100 - (s.y ?? 50)}%` }}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-[10px] font-bold transition ${
                shake === i
                  ? "border-red-500 bg-red-500/30 text-white"
                  : hovering
                  ? eligibleHover
                    ? "border-green-400 bg-green-400/30 text-white"
                    : "border-red-500 bg-red-500/30 text-white"
                  : player
                  ? locked
                    ? "border-amber-400 bg-amber-400/20 text-white shadow-[0_0_18px_-4px] shadow-amber-400/70"
                    : `${a.border} bg-black/40 text-white`
                  : "border-dashed border-white/40 bg-black/30 text-white/55"
              }`}
            >
              {player ? (locked ? "🔒" : initials(player.name)) : s.position}
            </div>
            <span className="mt-1 max-w-[80px] truncate rounded bg-black/60 px-1 text-[10px] font-medium text-white">
              {player ? lastName(player.name) : s.label}
            </span>
          </motion.button>
        );
      })}
    </>
  );
}

/* ----------------------------- bench slot ----------------------------- */
function BenchSlot<P extends BuilderPlayer>({
  slot,
  player,
  accent,
  selected,
  shake,
  isLocked,
  onClick,
  onDragOver,
  onDrop,
}: {
  slot: SlotDef;
  player: P | null;
  accent: "nba" | "soccer";
  selected: P | null;
  shake: boolean;
  isLocked: boolean;
  onClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const a = ACCENT[accent];
  return (
    <motion.button
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex h-14 flex-col items-center justify-center rounded-lg border text-xs transition ${
        shake
          ? "border-red-500 bg-red-500/20"
          : player
          ? isLocked
            ? "border-amber-400 bg-amber-400/15"
            : `${a.border} bg-white/5`
          : selected
          ? "border-green-400/60 bg-green-400/5"
          : "border-dashed border-white/20 bg-panel/40 text-white/40"
      }`}
    >
      {player ? (
        <>
          <span className="font-semibold">{lastName(player.name)}</span>
          <span className="text-[10px] text-white/40">{isLocked ? "🔒" : player.position}</span>
        </>
      ) : (
        slot.label
      )}
    </motion.button>
  );
}

function initials(name: string): string {
  const parts = name.split(" ");
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
}
function lastName(name: string): string {
  const parts = name.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : name;
}
