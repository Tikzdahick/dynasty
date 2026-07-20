"use client";

import { useEffect, useRef, useState } from "react";

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
 * error (item 6), and finally falling back to the name's initials. Sport-specific
 * URL building lives in the headshot resolvers (lib/nba/headshots,
 * lib/soccer/headshots) — this component has no knowledge of NBA vs soccer.
 *
 * `className` styles the (square/circular) container; the image fills it with
 * object-cover so every card looks uniform regardless of the source photo's
 * aspect ratio (item 8). A skeleton shimmer shows while loading and the photo
 * fades in (item 9) — the initials only appear if every source fails.
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
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {src ? (
        // key={src} remounts on fallthrough so the skeleton/onError reset per source
        <LoadingImg key={src} src={src} alt={name} onError={() => setIdx((i) => i + 1)} />
      ) : (
        initials(name)
      )}
    </div>
  );
}

function LoadingImg({
  src,
  alt,
  onError,
}: {
  src: string;
  alt: string;
  onError: () => void;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const reconciled = useRef(false);
  const [loaded, setLoaded] = useState(false);

  // These images are server-rendered, so a cached/fast image can finish loading
  // (or fail) BEFORE React hydrates and attaches onLoad/onError — the events
  // would then never fire. Reconcile against the DOM state on mount: a complete
  // image with real dimensions is loaded; a complete image with none has errored,
  // so advance the source chain just as onError would. The ref guard keeps this
  // to one advance per source (React StrictMode double-invokes effects in dev).
  useEffect(() => {
    if (reconciled.current) return;
    const img = ref.current;
    if (!img || !img.complete) return;
    reconciled.current = true;
    if (img.naturalWidth > 0) setLoaded(true);
    else onError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!loaded && <span aria-hidden className="absolute inset-0 animate-pulse bg-white/10" />}
      {/* eslint-disable-next-line @next/next/no-img-element -- plain img; onError walks the source chain, then falls back to initials */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={`h-full w-full object-cover object-top transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}
