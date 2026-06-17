"use client";

import { motion } from "framer-motion";
import { SlotDef, CourtPlayer } from "@/components/Court";
import { Chemistry } from "@/lib/chemistry";

interface Props<P extends CourtPlayer> {
  variant: "nba" | "soccer";
  accent: "nba" | "soccer";
  slots: SlotDef[];
  placed: (P | null)[];
  chemistry: Chemistry;
  rating: number | string;
  subtitle?: string;
  onSimulate: () => void;
  onBack: () => void;
}

const LABEL_STYLE: Record<string, string> = {
  Elite: "bg-amber-400/20 text-amber-300 border-amber-400/50",
  Good: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  Poor: "bg-white/5 text-white/50 border-white/15",
};

export function PreSimSummary<P extends CourtPlayer>({
  variant,
  accent,
  slots,
  placed,
  chemistry,
  rating,
  subtitle,
  onSimulate,
  onBack,
}: Props<P>) {
  const accentBg = accent === "nba" ? "bg-nba" : "bg-soccer";

  // map player id -> court coordinates (bench slots have none)
  const pos = new Map<string, { x: number; y: number }>();
  slots.forEach((s, i) => {
    const p = placed[i];
    if (p && !s.bench && s.x != null && s.y != null) pos.set(p.id, { x: s.x, y: s.y });
  });

  // connection lines between teammates who share a real team/decade
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const g of chemistry.groups) {
    const pts = g.playerIds.map((id) => pos.get(id)).filter(Boolean) as { x: number; y: number }[];
    for (let i = 1; i < pts.length; i++) {
      lines.push({ x1: pts[0].x, y1: 100 - pts[0].y, x2: pts[i].x, y2: 100 - pts[i].y });
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="text-center text-sm uppercase tracking-[0.3em] text-white/40">
        Pre-match summary
      </p>
      {subtitle && <p className="mb-3 text-center text-xs text-white/40">{subtitle}</p>}

      {/* court with connection lines */}
      <div
        className={`relative mx-auto mt-3 aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl border border-white/10 ${
          variant === "soccer"
            ? "bg-gradient-to-b from-green-900 to-green-950"
            : "bg-gradient-to-b from-[#3a2417] to-[#241208]"
        }`}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {lines.map((l, i) => (
            <motion.line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="#34d399"
              strokeWidth="0.7"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
            />
          ))}
        </svg>

        {slots.map((s, i) => {
          const p = placed[i];
          if (!p || s.bench || s.x == null || s.y == null) return null;
          return (
            <div
              key={s.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${s.x}%`, top: `${100 - s.y}%` }}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[9px] font-bold text-white ${
                  pos.has(p.id) && chemistry.groups.some((g) => g.playerIds.includes(p.id))
                    ? "border-emerald-400 bg-emerald-400/20"
                    : "border-white/30 bg-black/40"
                }`}
              >
                {initials(p.name)}
              </div>
              <span className="mt-0.5 max-w-[72px] truncate rounded bg-black/60 px-1 text-[9px] text-white">
                {lastName(p.name)}
              </span>
            </div>
          );
        })}
      </div>

      {/* chemistry badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-panel p-4"
      >
        <div>
          <div className="text-xs uppercase tracking-wide text-white/40">Chemistry</div>
          <div
            className={`mt-1 inline-block rounded-full border px-3 py-0.5 text-sm font-black ${
              LABEL_STYLE[chemistry.label]
            }`}
          >
            {chemistry.label}
            <span className="ml-1 font-semibold">
              {chemistry.pct >= 0 ? `+${chemistry.pct}` : chemistry.pct}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-white/40">Rating</div>
          <div className={`text-2xl font-black ${accent === "nba" ? "text-nba" : "text-soccer"}`}>
            {rating}
          </div>
        </div>
      </motion.div>

      <p className="mt-2 text-center text-sm text-white/50">{chemistry.note}</p>

      {chemistry.groups.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {chemistry.groups.map((g) => (
            <span
              key={g.key}
              className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-2 py-1 text-xs text-emerald-200"
            >
              {g.decade} {g.team} ×{g.playerIds.length}
              {g.isClub && " 🏟️"}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button onClick={onBack} className="btn-ghost flex-1">
          ← Edit
        </button>
        <motion.button
          onClick={onSimulate}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className={`btn flex-1 ${accentBg} text-black hover:opacity-90`}
        >
          Simulate →
        </motion.button>
      </div>
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
