"use client";

import { useState } from "react";

/** Two-letter initials for the medallion fallback. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * The single component any card uses to render a player headshot. Renders the
 * first image source that loads, walking the ordered `sources` list on each load
 * error, and finally falling back to the name's initials. Sport-specific URL
 * building lives in the headshot resolvers (lib/nba/headshots, lib/soccer/
 * headshots) — this component has no knowledge of NBA vs soccer.
 *
 * `className` styles the (square/circular) container; the image fills it.
 */
export function Portrait({
  sources,
  name,
  className = "",
}: {
  sources: string[];
  name: string;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const src = idx < sources.length ? sources[idx] : undefined;

  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- plain img; onError walks the source chain, then falls back to initials
        <img
          key={src}
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}
