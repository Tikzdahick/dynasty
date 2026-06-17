"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HowToPlay() {
  return (
    <div className="mx-auto max-w-2xl bg-grain">
      <Link href="/" className="text-sm text-white/40 hover:text-white">
        ← Home
      </Link>
      <h1 className="mt-1 text-3xl font-black">How to play</h1>
      <p className="mb-8 text-white/55">
        Dynasty is a round-by-round draft game. Spin for a decade &amp; team,
        pick from the legends it serves up, build a lineup, then simulate.
      </p>

      <Section emoji="🎰" title="The round-by-round draft" accent="text-nba-gold">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-white/70">
          <li>Each round, two reels spin — a <b>decade</b> (1950s–2020s) and a <b>team</b> (an NBA franchise or a nation).</li>
          <li>Four player cards are revealed — the best available from that team/era.</li>
          <li>Pick <b>one</b>. The other three drop into your <b>leftover pool</b> for later.</li>
          <li>Place your pick into an eligible position slot. Multiple eligible? You choose. One option? It auto-snaps.</li>
          <li>Repeat until all starters are filled, then pick your bench/subs from the leftover pool.</li>
        </ol>
      </Section>

      <Section emoji="🔁" title="Skips" accent="text-white">
        <p className="text-sm text-white/70">
          Each draft gives you <b>1 Team Skip</b> (keep the decade, re-roll the team)
          and <b>1 Era Skip</b> (keep the team, re-roll the decade). Use them wisely —
          they&apos;re single-use, and Daily Challenge gives none.
        </p>
      </Section>

      <Section emoji="🔥" title="Harder mechanics" accent="text-amber-300">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-white/70">
          <li><b>⏱ Timer Mode</b> (optional toggle): every round has a 20-second countdown. Let it hit zero and a random card is auto-drafted — the bar turns red and pulses in the last 5 seconds.</li>
          <li><b>🧠 Hidden Stats</b> (Hoop IQ / Soccer IQ): stat bars are hidden. Tap or hover a card to <b>peek for 2 seconds</b>, then it hides again. Draft from memory.</li>
          <li><b>🫥 Decoy cards</b>: in IQ modes, one card per round may be a <b>ghost</b> — flashy inflated stats and a subtle shimmer, but it plays far worse once you simulate. Spot it or pay the price.</li>
        </ul>
      </Section>

      <Section emoji="🏀" title="NBA Mode" accent="text-nba">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-white/70">
          <li>Draft <b>5 starters</b> (PG, SG, SF, PF, C) + <b>3 bench</b>.</li>
          <li>Players are eligible for the positions they really played.</li>
          <li>Simulate an <b>82-game season</b> — every game has a score. Can you go 82-0?</li>
          <li><b>Classic</b> shows stats; <b>Hoop IQ</b> hides them; <b>Daily</b> is the same spins for everyone; <b>Team Draft</b> lets you pick decade &amp; team yourself.</li>
        </ul>
      </Section>

      <Section emoji="⚽" title="Soccer Mode" accent="text-soccer">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-white/70">
          <li>Pick a <b>formation</b> (4-3-3, 4-4-2, 3-5-2, 4-2-3-1).</li>
          <li>Draft <b>11 starters</b> to fill every position + <b>3 subs</b>.</li>
          <li>Simulate a <b>7-game World Cup run</b>: group stage → knockouts → final.</li>
          <li><b>Classic</b> shows stats; <b>Soccer IQ</b> hides them and tests your memory.</li>
        </ul>
      </Section>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/nba" className="btn bg-nba text-center text-black hover:bg-nba-gold">
          🏀 Play NBA
        </Link>
        <Link href="/soccer" className="btn bg-soccer text-center text-black hover:bg-soccer-gold">
          ⚽ Play Soccer
        </Link>
      </div>
    </div>
  );
}

function Section({
  emoji,
  title,
  accent,
  children,
}: {
  emoji: string;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="card mb-4 p-5"
    >
      <h2 className={`mb-2 flex items-center gap-2 text-lg font-bold ${accent}`}>
        <span>{emoji}</span> {title}
      </h2>
      {children}
    </motion.section>
  );
}
