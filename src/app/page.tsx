"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="bg-grain">
      {/* Hero */}
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
            Fantasy Draft · Simulation
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
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2 sm:mt-16">
          <ModeCard
            href="/nba"
            emoji="🏀"
            title="NBA Mode"
            sub="Can you go 82-0?"
            blurb="Draft 8 all-time greats under a salary cap and simulate an undefeated season."
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
            blurb="Pick a formation, draft an all-time XI, and conquer a 7-game World Cup run."
            from="from-soccer/30"
            ring="hover:border-soccer/50"
            accent="text-soccer"
            delay={0.2}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-3 text-center text-sm text-white/40"
        >
          <span>50+ NBA legends</span>
          <span className="text-white/15">•</span>
          <span>60+ football icons</span>
          <span className="text-white/15">•</span>
          <span>Global leaderboard</span>
          <span className="text-white/15">•</span>
          <span>Play as guest</span>
        </motion.div>
      </section>
    </div>
  );
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
