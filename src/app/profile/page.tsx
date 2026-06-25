"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getLocalNba, getLocalSoccer } from "@/lib/store/local";
import { currentStreak, getStreak, getUnlocked } from "@/lib/store/stats";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { NbaLeaderboardEntry, SoccerLeaderboardEntry } from "@/types";

export default function ProfilePage() {
  const { user, displayName, configured, signOut } = useAuth();
  const [nba, setNba] = useState<NbaLeaderboardEntry[]>([]);
  const [soccer, setSoccer] = useState<SoccerLeaderboardEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    setNba(getLocalNba().reverse());
    setSoccer(getLocalSoccer().reverse());
    setStreak(currentStreak());
    setBestStreak(getStreak().best);
    setUnlocked(getUnlocked());
  }, []);

  const bestNba = nba.reduce<NbaLeaderboardEntry | null>(
    (best, e) => (!best || e.wins > best.wins ? e : best),
    null
  );
  const champ = soccer.some((s) => s.result === "Champion");

  return (
    <div className="bg-grain">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-nba to-soccer text-2xl font-black text-black">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black">{displayName}</h1>
            <p className="text-sm text-white/40">
              {user ? user.email : "Guest player (local saves only)"}
            </p>
          </div>
        </div>
        {user && (
          <button onClick={signOut} className="btn-ghost text-sm">
            Sign out
          </button>
        )}
      </div>

      {!user && (
        <div className="card mb-6 flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/60">
            {configured
              ? "Sign in to sync your dynasties to the global leaderboard."
              : "Supabase isn't configured — results save locally on this device."}
          </p>
          {configured && (
            <Link href="/login" className="btn bg-white text-black hover:bg-white/90">
              Sign in
            </Link>
          )}
        </div>
      )}

      {/* quick stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Best NBA" value={bestNba ? `${bestNba.wins}-${bestNba.losses}` : "—"} accent="text-nba" />
        <StatTile label="Seasons" value={String(nba.length)} accent="text-nba" />
        <StatTile label="Trophies" value={champ ? "🏆" : "0"} accent="text-soccer" />
        <StatTile
          label={bestStreak > streak ? `Streak · best ${bestStreak}` : "Daily streak"}
          value={streak > 0 ? `🔥 ${streak}` : "0"}
          accent="text-soccer-gold"
        />
      </div>

      {/* achievements */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center justify-between text-lg font-bold">
          <span>🎖 Achievements</span>
          <span className="text-sm font-normal text-white/40">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.includes(a.id);
            return (
              <div
                key={a.id}
                className={`card flex items-center gap-3 p-3 transition ${
                  got ? "" : "opacity-40 grayscale"
                }`}
                title={a.desc}
              >
                <span className="text-2xl">{got ? a.emoji : "🔒"}</span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{a.label}</div>
                  <div className="truncate text-[11px] text-white/45">{a.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* NBA rosters */}
      <Section title="🏀 NBA Seasons" empty={nba.length === 0} href="/nba" cta="Play NBA Mode">
        {nba.map((e) => (
          <div key={e.id} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-black tabular-nums text-nba">
                {e.wins}-{e.losses}
              </span>
              <span className="text-xs text-white/30">OVR {e.rating}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {e.players.map((p) => (
                <span key={p} className="rounded bg-white/5 px-2 py-0.5 text-xs">
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* Soccer rosters */}
      <Section title="⚽ Tournaments" empty={soccer.length === 0} href="/soccer" cta="Play Soccer Mode">
        {soccer.map((e) => (
          <div key={e.id} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-soccer">
                {e.result} {e.result === "Champion" && "🏆"}
              </span>
              <span className="text-xs text-white/30">{e.formation}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {e.players.map((p) => (
                <span key={p} className="rounded bg-white/5 px-2 py-0.5 text-xs">
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-2xl font-black ${accent}`}>{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}

function Section({
  title,
  empty,
  href,
  cta,
  children,
}: {
  title: string;
  empty: boolean;
  href: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {empty ? (
        <div className="card p-6 text-center text-sm text-white/40">
          No saved rosters yet.{" "}
          <Link href={href} className="text-white underline">
            {cta}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}
