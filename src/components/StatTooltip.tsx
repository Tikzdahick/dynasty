"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Plain-language meaning for every stat abbreviation shown on cards / draft bars.
// DEF is shared (soccer "Defending" / NBA "Defense") — one entry reads fine for both.
const GLOSSARY: Record<string, { name: string; desc: string }> = {
  PAC: { name: "Pace", desc: "How fast the player is — sprint speed and acceleration." },
  SHO: { name: "Shooting", desc: "Finishing and shot power in front of goal." },
  PAS: { name: "Passing", desc: "Vision, crossing, and passing accuracy." },
  DEF: { name: "Defense", desc: "Tackling, marking, and defensive work rate." },
  SPD: { name: "Speed", desc: "How quick the player is on the court." },
  SHT: { name: "Shooting", desc: "Scoring ability from the field and range." },
  SCO: { name: "Scoring", desc: "Points production — how much this player puts up." },
  REB: { name: "Rebounding", desc: "Grabbing missed shots off both ends of the floor." },
  PLY: { name: "Playmaking", desc: "Creating scoring chances for teammates (assists)." },
  OVR: { name: "Overall", desc: "The player's overall rating across all attributes." },
};

/**
 * A stat abbreviation with an explanatory tooltip. Works on desktop hover/focus
 * and mobile tap; the popover renders in a portal so it isn't clipped by the
 * card's overflow-hidden. Uses a role="button" span (not <button>) so it can sit
 * inside clickable cards without nesting interactive elements.
 */
export function StatTooltip({ abbr, className = "" }: { abbr: string; className?: string }) {
  const info = GLOSSARY[abbr.toUpperCase()];
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; below: boolean } | null>(null);

  const place = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const halfW = 90; // ~ half the w-44 tooltip + margin, to keep it on-screen
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const left = Math.max(halfW + 4, Math.min(vw - halfW - 4, r.left + r.width / 2));
    const below = r.top < 90; // flip below the label if there's no room above
    setCoords({ top: below ? r.bottom + 8 : r.top - 8, left, below });
  };
  const show = () => {
    place();
    setOpen(true);
  };
  const hide = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) hide();
    };
    const onMove = () => hide();
    document.addEventListener("pointerdown", onDoc);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  if (!info) return <span className={className}>{abbr}</span>;

  return (
    <>
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          // Always show (never toggle): on a tap, mouseenter may fire first, so a
          // toggle would immediately close it. Dismiss via tap-outside / mouseleave.
          e.stopPropagation();
          show();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            open ? hide() : show();
          } else if (e.key === "Escape") {
            hide();
          }
        }}
        aria-label={`${info.name}: ${info.desc}`}
        className={`${className} cursor-help underline decoration-dotted decoration-white/25 underline-offset-2`}
      >
        {abbr}
      </span>
      {open &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: coords.below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
              zIndex: 80,
            }}
            className="pointer-events-none w-44 rounded-lg border border-white/15 bg-ink px-3 py-2 text-left shadow-2xl"
          >
            <div className="text-xs font-bold normal-case tracking-normal text-white">{info.name}</div>
            <div className="mt-0.5 text-[11px] font-normal normal-case leading-snug tracking-normal text-white/60">
              {info.desc}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
