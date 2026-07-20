"use client";

// Tracks whether the first-time walkthrough has been shown. Per-browser (there's
// no account system) — the "new user" signal for a localStorage game.
const KEY = "dynasty.tutorial.seen";

export function hasSeenTutorial(): boolean {
  if (typeof window === "undefined") return true; // avoid flashing during SSR
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function markTutorialSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}
