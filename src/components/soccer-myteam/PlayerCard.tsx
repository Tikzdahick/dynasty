"use client";

import { useState } from "react";
import { Card, tierForCard } from "@/lib/soccer-myteam/cards";

const HEADSHOT_BASE = "https://a.espncdn.com/i/headshots/soccer/players/full";

interface Props {
  card?: Card | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const SIZES = {
  sm: { w: "w-full", pad: "p-2.5", ovr: "text-2xl", name: "text-xs", stat: "text-[10px]" },
  md: { w: "w-full", pad: "p-3", ovr: "text-3xl", name: "text-sm", stat: "text-[11px]" },
  lg: { w: "w-56", pad: "p-4", ovr: "text-5xl", name: "text-lg", stat: "text-sm" },
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PlayerCard({ card, size = "md", className = "", onClick }: Props) {
  if (!card) return null;
  const t = tierForCard(card);
  const s = SIZES[size];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={`relative ${s.w} overflow-hidden rounded-2xl bg-gradient-to-b ${t.grad} text-left ring-2 ${t.ring} ${t.glow} ${onClick ? "transition hover:-translate-y-1" : ""} ${className}`}
    >
      {/* top row: overall + position */}
      <div className={`flex items-start justify-between ${s.pad} pb-0`}>
        <div className="leading-none">
          <div className={`${s.ovr} font-black tabular-nums ${t.text}`}>
            {card.overall}
            {card.upgradeLevel ? (
              <span className="align-top text-[0.45em] font-black text-emerald-300">
                {" "}+{card.upgradeLevel}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
            {card.position}
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
            card.moment ? "bg-fuchsia-400/25 text-fuchsia-100" : t.chip
          }`}
        >
          {card.moment ? "🔥 Moment" : t.label}
        </span>
      </div>

      {/* portrait: real ESPN headshot when available, initials medallion otherwise */}
      <div className="flex justify-center py-1">
        <Portrait card={card} size={size} />
      </div>

      {/* name */}
      <div className={`${s.pad} py-0 text-center`}>
        <div className={`${s.name} truncate font-bold text-white`} title={card.name}>
          {card.name}
        </div>
        {card.moment && card.momentTitle ? (
          <div className="truncate text-[9px] font-semibold text-fuchsia-300">{card.momentTitle}</div>
        ) : (card.team || card.country || card.era) ? (
          <div className="truncate text-[9px] text-white/45">{card.team ?? card.country ?? card.era}</div>
        ) : null}
      </div>

      {/* stats */}
      <div className={`mt-2 grid grid-cols-4 gap-px bg-white/10 ${s.stat} font-semibold`}>
        <Stat label="PAC" value={card.pace} />
        <Stat label="SHO" value={card.shooting} />
        <Stat label="PAS" value={card.passing} />
        <Stat label="DEF" value={card.defending} />
      </div>
    </Tag>
  );
}

/** Circular portrait. Tries image sources in priority order —
 *  ESPN headshot (espnPlayerId) → cached Wikipedia image → initials medallion —
 *  advancing to the next on each load error, and finally to initials. */
function Portrait({ card, size }: { card: Card; size: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-20" : "w-12";

  const sources: string[] = [];
  if (card.espnPlayerId != null) sources.push(`${HEADSHOT_BASE}/${card.espnPlayerId}.png`);
  if (card.wikipediaImageUrl) sources.push(card.wikipediaImageUrl);

  const [idx, setIdx] = useState(0);
  const src = sources[idx];

  return (
    <div
      className={`flex aspect-square ${dim} items-center justify-center overflow-hidden rounded-full bg-black/30 font-black text-white/80`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the CDNs unproxied; onError walks the source chain / falls back to initials
        <img
          key={src}
          src={src}
          alt={card.name}
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        initials(card.name)
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-black/40 px-1 py-1 text-center">
      <div className="tabular-nums text-white">{value}</div>
      <div className="text-[8px] uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}
