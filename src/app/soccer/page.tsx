"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DraftMode } from "@/components/RoundDraft";

const MODES: { mode: DraftMode; emoji: string; title: string; blurb: string }[] = [
  { mode: "classic", emoji: "📊", title: "Classic", blurb: "Full player stats visible during the draft." },
  { mode: "iq", emoji: "🧠", title: "Soccer IQ", blurb: "Stats hidden — peek 2s per card. Watch for decoys." },
  { mode: "daily", emoji: "📅", title: "Daily Challenge", blurb: "Everyone gets the same spins today. No skips." },
  { mode: "team", emoji: "🎯", title: "Team Draft", blurb: "Choose your own decade & nation each round." },
];

export default function SoccerModeSelect() {
  const router = useRouter();
  const [timed, setTimed] = useState(false);
  const go = (mode: DraftMode) => {
    sessionStorage.setItem("dynasty.soccer.mode", mode);
    sessionStorage.setItem("dynasty.soccer.timer", timed ? "1" : "0");
    router.push("/soccer/draft");
  };

  return (
    <div className="bg-grain">
      <div className="mb-6">
        <Link href="/" className="text-sm text-white/40 hover:text-white">
          ← Home
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-black">
          ⚽ <span className="text-soccer">Soccer</span> Mode
        </h1>
        <p className="text-sm text-white/50">
          Spin round by round, draft an all-time XI, win the trophy.{" "}
          <Link href="/how-to-play" className="text-soccer hover:underline">
            How to play
          </Link>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODES.map((m, i) => (
          <motion.button
            key={m.mode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => go(m.mode)}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-panel p-6 text-left transition hover:-translate-y-1 hover:border-soccer/50"
          >
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-soccer/15 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="text-4xl">{m.emoji}</div>
            <h3 className="mt-3 text-xl font-bold">{m.title}</h3>
            <p className="mt-1 text-sm text-white/55">{m.blurb}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-white/80 group-hover:translate-x-1">
              Start →
            </span>
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => setTimed((t) => !t)}
        className={`mt-4 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
          timed ? "border-soccer/60 bg-soccer/10" : "border-white/10 bg-panel hover:border-white/20"
        }`}
      >
        <div>
          <div className="font-bold">⏱ Timer Mode</div>
          <div className="text-sm text-white/55">20s per round — run out of time and a random card is auto-drafted.</div>
        </div>
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${timed ? "bg-soccer" : "bg-white/15"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${timed ? "left-[22px]" : "left-0.5"}`}
          />
        </span>
      </button>
    </div>
  );
}
