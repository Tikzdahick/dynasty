"use client";

import { motion } from "framer-motion";
import { Portrait } from "@/components/Portrait";
import { nbaHeadshotSources } from "@/lib/nba/headshots";
import { soccerHeadshotSources } from "@/lib/soccer/headshots";

export interface SlotDef {
  id: string;
  position: string; // coarse position or "ANY"
  label: string;
  x?: number;
  y?: number;
  bench?: boolean;
}

export interface CourtPlayer {
  id: string;
  name: string;
  position: string;
}

const ACCENT = {
  nba: "border-nba",
  soccer: "border-soccer",
};

interface CourtProps<P extends CourtPlayer> {
  variant: "nba" | "soccer";
  accent: "nba" | "soccer";
  slots: SlotDef[];
  placed: (P | null)[];
  highlight: Set<number>;
  lockedId: string | null;
  shakeSlot: number | null;
  onSlotClick: (i: number) => void;
}

export function CourtView<P extends CourtPlayer>(props: CourtProps<P>) {
  const courtSlots = props.slots
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !s.bench);

  return (
    <div
      className={`relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 ${
        props.variant === "soccer"
          ? "bg-gradient-to-b from-green-900 to-green-950"
          : "bg-gradient-to-b from-[#3a2417] to-[#241208]"
      }`}
    >
      {props.variant === "soccer" ? <PitchMarks /> : <CourtMarks />}
      {courtSlots.map(({ s, i }) => (
        <SlotNode key={s.id} {...props} s={s} i={i} coords />
      ))}
    </div>
  );
}

export function BenchRow<P extends CourtPlayer>({
  label,
  ...props
}: CourtProps<P> & { label: string }) {
  const benchSlots = props.slots
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.bench);
  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
        {label}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {benchSlots.map(({ s, i }) => {
          const player = props.placed[i];
          const locked = !!player && player.id === props.lockedId;
          const hl = props.highlight.has(i);
          const shaking = props.shakeSlot === i;
          return (
            <motion.button
              key={s.id}
              onClick={() => props.onSlotClick(i)}
              animate={shaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={`flex h-14 flex-col items-center justify-center rounded-lg border text-xs transition ${
                shaking
                  ? "border-red-500 bg-red-500/20"
                  : player
                  ? locked
                    ? "border-amber-400 bg-amber-400/15"
                    : `${ACCENT[props.accent]} bg-white/5`
                  : hl
                  ? "border-green-400 bg-green-400/10"
                  : "border-dashed border-white/20 bg-panel/40 text-white/40"
              }`}
            >
              {player ? (
                <>
                  <span className="font-semibold">{lastName(player.name)}</span>
                  <span className="text-[10px] text-white/40">
                    {locked ? "🔒" : player.position}
                  </span>
                </>
              ) : (
                s.label
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function SlotNode<P extends CourtPlayer>({
  variant,
  accent,
  placed,
  highlight,
  lockedId,
  shakeSlot,
  onSlotClick,
  s,
  i,
}: CourtProps<P> & { s: SlotDef; i: number; coords?: boolean }) {
  const player = placed[i];
  const locked = !!player && player.id === lockedId;
  const hl = highlight.has(i);
  const shaking = shakeSlot === i;

  return (
    <motion.button
      onClick={() => onSlotClick(i)}
      animate={shaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${s.x}%`, top: `${100 - (s.y ?? 50)}%` }}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-[10px] font-bold transition ${
          shaking
            ? "border-red-500 bg-red-500/30 text-white"
            : hl
            ? "border-green-400 bg-green-400/30 text-white"
            : player
            ? locked
              ? "border-amber-400 bg-amber-400/20 text-white shadow-[0_0_18px_-4px] shadow-amber-400/70"
              : `${ACCENT[accent]} bg-black/40 text-white`
            : "border-dashed border-white/40 bg-black/30 text-white/55"
        }`}
      >
        {player ? (
          locked ? (
            "🔒"
          ) : (
            <Portrait
              sources={variant === "nba" ? nbaHeadshotSources(player) : soccerHeadshotSources(player)}
              name={player.name}
              className="h-full w-full rounded-full"
            />
          )
        ) : (
          s.position
        )}
      </div>
      <span className="mt-1 max-w-[84px] truncate rounded bg-black/60 px-1 text-[10px] font-medium text-white">
        {player ? lastName(player.name) : s.label}
      </span>
    </motion.button>
  );
}

function PitchMarks() {
  return (
    <>
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
    </>
  );
}

function CourtMarks() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none">
        <line x1="42" y1="6" x2="58" y2="6" />
        <circle cx="50" cy="9" r="2" />
        <rect x="38" y="6" width="24" height="34" />
        <circle cx="50" cy="40" r="10" />
        <path d="M16 6 L16 26 A40 40 0 0 0 84 26 L84 6" />
        <line x1="2" y1="98" x2="98" y2="98" />
      </g>
    </svg>
  );
}

function lastName(name: string): string {
  const parts = name.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : name;
}
