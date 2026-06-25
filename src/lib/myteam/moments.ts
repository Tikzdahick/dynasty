// Moments — scheduling/availability for the limited-time boosted cards defined
// in cards.ts. One moment is "live" at a time on a rotating window; others are
// upcoming. While live, a card can be claimed for coins from the Moments page.
import { MOMENT_CARDS, Card } from "@/lib/myteam/cards";

const WINDOW_MS = 3 * 86_400_000; // each moment is live for 3 days
const ANCHOR = new Date("2026-06-22T00:00:00").getTime();
const SEEN_KEY = "dynasty.moments.lastSeen";

export interface LiveMoment {
  card: Card;
  endsAt: number;
}
export interface UpcomingMoment {
  card: Card;
  startsAt: number;
}

function liveIndex(now = Date.now()): number {
  const k = Math.floor((now - ANCHOR) / WINDOW_MS);
  return ((k % MOMENT_CARDS.length) + MOMENT_CARDS.length) % MOMENT_CARDS.length;
}

export function getLiveMoment(now = Date.now()): LiveMoment {
  const k = Math.floor((now - ANCHOR) / WINDOW_MS);
  return {
    card: MOMENT_CARDS[liveIndex(now)],
    endsAt: ANCHOR + (k + 1) * WINDOW_MS,
  };
}

export function getUpcomingMoments(count = 3, now = Date.now()): UpcomingMoment[] {
  const k = Math.floor((now - ANCHOR) / WINDOW_MS);
  const out: UpcomingMoment[] = [];
  for (let i = 1; i <= count; i++) {
    out.push({
      card: MOMENT_CARDS[(liveIndex(now) + i) % MOMENT_CARDS.length],
      startsAt: ANCHOR + (k + i) * WINDOW_MS,
    });
  }
  return out;
}

/** Coin price to claim a live moment, scaled by its rating. */
export function momentPrice(card: Card): number {
  return Math.round((2500 + (card.overall - 95) * 700) / 100) * 100;
}

/** Returns the live moment if it changed since last seen (for a drop notice). */
export function consumeNewMomentDrop(): Card | null {
  if (typeof window === "undefined") return null;
  const live = getLiveMoment().card;
  const last = localStorage.getItem(SEEN_KEY);
  if (last === live.id) return null;
  localStorage.setItem(SEEN_KEY, live.id);
  // don't fire on the very first ever load (no prior value)
  return last == null ? null : live;
}
