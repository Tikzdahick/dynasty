"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  className?: string;
  /** ms duration of the count animation */
  duration?: number;
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** A number that smoothly counts to its new value whenever `value` changes. */
export function AnimatedNumber({ value, className = "", duration = 650 }: Props) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + (to - from) * easeOut(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
