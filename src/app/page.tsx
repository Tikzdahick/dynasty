"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { currentStreak } from "@/lib/store/stats";

const LEGENDS = [
  "Michael Jordan", "Pelé", "LeBron James", "Maradona", "Kareem", "Messi",
  "Magic Johnson", "Cristiano Ronaldo", "Larry Bird", "Zidane", "Kobe Bryant",
  "Cruyff", "Shaq", "Beckenbauer", "Curry", "Ronaldinho", "Hakeem", "Xavi",
  "Duncan", "Maldini", "Giannis", "Iniesta", "Jokić", "Puskás", "Wilt", "Buffon",
];

export default function HomePage() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(currentStreak());
  }, []);

  const playDaily = (sport: "nba" | "soccer") => {
    sessionStorage.setItem(`dynasty.${sport}.mode`, "daily");
    router.push(`/${sport}/draft`);
  };

  return (
    <div className="bg-grain">
      <section className="relative overflow-hidden pt-10 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-nba/20 blur-[120px]" />
          <div className="absolute -right-32 top-20 h-72 w-72 rounded-full bg-soccer/20 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Spin · Draft · Simulate
          </p>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
            <span className="bg-gradient-to-r from-nba via-amber-300 to-soccer bg-clip-text text-transparent">
              DYNASTY
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-white/60 sm:text-xl">
            Build the greatest team ever assembled.
          </p>
        </motion.div>

        {/* Mode cards */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:mt-16 sm:grid-cols-2">
          <ModeCard
            href="/nba"
            emoji="🏀"
            title="NBA Mode"
            sub="Can you go 82-0?"
            blurb="Spin round by round, draft 8 legends across the decades, and simulate an undefeated 82-game season."
            from="from-nba/30"
            ring="hover:border-nba/50"
            accent="text-nba"
            delay={0.1}
          />
          <ModeCard
            href="/soccer"
            emoji="⚽"
            title="Soccer Mode"
            sub="Can you win the trophy?"
            blurb="Pick a formation, spin for icons to fill your XI, and conquer a 7-game World Cup run."
            from="from-soccer/30"
            ring="hover:border-soccer/50"
            accent="text-soccer"
            delay={0.2}
          />
        </div>

        {/* MyTeam promo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-auto mt-5 max-w-4xl"
        >
          <Link
            href="/myteam"
            className="group flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-500/15 via-panel/70 to-amber-400/10 p-5 transition hover:border-fuchsia-400/40"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🃏</span>
              <div>
                <div className="font-bold">
                  MyTeam <span className="ml-1 rounded bg-fuchsia-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fuchsia-200">New</span>
                </div>
                <p className="text-sm text-white/55">Open packs, collect legendary cards, build your ultimate roster.</p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold text-white/80 transition group-hover:translate-x-1">
              Open packs →
            </span>
          </Link>
        </motion.div>

        {/* Daily Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-5 flex max-w-4xl flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-panel/70 p-4 sm:flex-row"
        >
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <span className="text-xl">📅</span>
              <span className="font-bold">Daily Challenge</span>
              {streak > 1 && (
                <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                  🔥 {streak}-day streak
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-white/50">
              Everyone drafts the same spins today. No skips — just instincts.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => playDaily("nba")}
              className="btn bg-nba/90 px-4 py-2 text-sm text-black hover:bg-nba"
            >
              🏀 Today
            </button>
            <button
              onClick={() => playDaily("soccer")}
              className="btn bg-soccer/90 px-4 py-2 text-sm text-black hover:bg-soccer"
            >
              ⚽ Today
            </button>
          </div>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm text-white/40"
        >
          <span>Round-by-round draft</span>
          <Dot />
          <span>110+ legends</span>
          <Dot />
          <span>Global leaderboard</span>
          <Dot />
          <Link href="/how-to-play" className="text-white/60 underline-offset-2 hover:text-white hover:underline">
            How to play
          </Link>
        </motion.div>
      </section>

      {/* Legends marquee */}
      <div className="relative mt-12 overflow-hidden border-y border-white/5 py-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent" />
        <motion.div
          className="flex w-max gap-8 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        >
          {[...LEGENDS, ...LEGENDS].map((n, i) => (
            <span key={i} className="text-sm font-semibold tracking-wide text-white/25">
              {n}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="text-white/15">•</span>;
}

function ModeCard({
  href,
  emoji,
  title,
  sub,
  blurb,
  from,
  ring,
  accent,
  delay,
}: {
  href: string;
  emoji: string;
  title: string;
  sub: string;
  blurb: string;
  from: string;
  ring: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      <Link
        href={href}
        className={`group relative block overflow-hidden rounded-3xl border border-white/10 bg-panel p-7 transition duration-300 hover:-translate-y-1 ${ring}`}
      >
        <div
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${from} to-transparent opacity-60 transition group-hover:opacity-100`}
        />
        <div className="text-5xl">{emoji}</div>
        <h2 className="mt-4 text-2xl font-bold">{title}</h2>
        <p className={`mt-1 text-lg font-semibold ${accent}`}>{sub}</p>
        <p className="mt-3 text-sm leading-relaxed text-white/55">{blurb}</p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white/80">
          Start drafting
          <span className="transition group-hover:translate-x-1">→</span>
        </span>
      </Link>
    </motion.div>
  );
}
