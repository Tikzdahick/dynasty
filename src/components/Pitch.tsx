"use client";

import { motion } from "framer-motion";
import { Formation, SoccerPlayer, SoccerPosition } from "@/types";

interface PitchProps {
  formation: Formation;
  // assignment[slotIndex] = player or null
  assignment: (SoccerPlayer | null)[];
  hideStats?: boolean;
  onSlotClick?: (index: number) => void;
  activeSlot?: number | null;
}

const POS_COLOR: Record<SoccerPosition, string> = {
  GK: "bg-amber-400 text-black",
  DEF: "bg-sky-500 text-white",
  MID: "bg-soccer text-black",
  FWD: "bg-rose-500 text-white",
};

export function Pitch({
  formation,
  assignment,
  hideStats,
  onSlotClick,
  activeSlot,
}: PitchProps) {
  return (
    <div className="relative mx-auto aspect-[2/3] w-full max-w-sm overflow-hidden rounded-2xl border border-white/10">
      {/* turf */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-900 to-green-950" />
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`absolute left-0 right-0 ${i % 2 ? "bg-white/[0.03]" : ""}`}
          style={{ top: `${(i / 6) * 100}%`, height: `${100 / 6}%` }}
        />
      ))}
      {/* markings */}
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/20" />
      <div className="absolute left-1/2 top-0 h-16 w-32 -translate-x-1/2 border-x border-b border-white/20" />
      <div className="absolute bottom-0 left-1/2 h-16 w-32 -translate-x-1/2 border-x border-t border-white/20" />

      {/* players */}
      {formation.slots.map((slot, i) => {
        const player = assignment[i];
        const active = activeSlot === i;
        return (
          <button
            key={i}
            onClick={() => onSlotClick?.(i)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
          >
            <motion.div
              layout
              animate={active ? { scale: 1.12 } : { scale: 1 }}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-[11px] font-bold shadow-lg ${
                player ? POS_COLOR[player.position] : "border-dashed"
              } ${
                active
                  ? "border-white ring-2 ring-white/60"
                  : player
                  ? "border-white/30"
                  : "border-white/40 bg-black/30 text-white/50"
              }`}
            >
              {player ? initials(player.name) : slot.position}
            </motion.div>
            {player && (
              <span className="mt-1 max-w-[72px] truncate rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                {lastName(player.name)}
                {!hideStats && (
                  <span className="ml-1 text-soccer-gold">{player.overall}</span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
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
