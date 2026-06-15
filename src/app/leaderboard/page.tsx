"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getNbaLeaderboard,
  getSoccerLeaderboard,
  TimeFilter,
} from "@/lib/store/leaderboard";
import { NbaLeaderboardEntry, SoccerLeaderboardEntry } from "@/types";

type Tab = "nba" | "soccer";

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "all", label: "All-Time" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("nba");
  const [filter, setFilter] = useState<TimeFilter>("all");
  const [nba, setNba] = useState<NbaLeaderboardEntry[]>([]);
  const [soccer, setSoccer] = useState<SoccerLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      if (tab === "nba") {
        const data = await getNbaLeaderboard(filter);
        if (active) setNba(data);
      } else {
        const data = await getSoccerLeaderboard(filter);
        if (active) setSoccer(data);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tab, filter]);

  const accent = tab === "nba" ? "nba" : "soccer";

  return (
    <div className="bg-grain">
      <h1 className="text-3xl font-black">Leaderboard</h1>
      <p className="mb-6 text-sm text-white/50">The greatest dynasties ever drafted.</p>

      {/* tabs */}
      <div className="mb-4 flex gap-2">
        {(["nba", "soccer"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-4 py-2.5 font-bold transition sm:flex-none sm:px-8 ${
              tab === t
                ? t === "nba"
                  ? "bg-nba text-black"
                  : "bg-soccer text-black"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            {t === "nba" ? "🏀 NBA" : "⚽ Soccer"}
          </button>
        ))}
      </div>

      {/* time filters */}
      <div className="mb-5 flex gap-2">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : tab === "nba" ? (
        nba.length === 0 ? (
          <Empty accent={accent} />
        ) : (
          <div className="space-y-2">
            {nba.map((e, i) => (
              <Row key={e.id} rank={i + 1} accent="nba">
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{e.username}</div>
                  <div className="truncate text-xs text-white/40">
                    {e.players.join(" · ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black tabular-nums text-nba">
                    {e.wins}-{e.losses}
                  </div>
                  <div className="text-[11px] text-white/30">{fmtDate(e.created_at)}</div>
                </div>
              </Row>
            ))}
          </div>
        )
      ) : soccer.length === 0 ? (
        <Empty accent={accent} />
      ) : (
        <div className="space-y-2">
          {soccer.map((e, i) => (
            <Row key={e.id} rank={i + 1} accent="soccer">
              <div className="min-w-0 flex-1">
                <div className="font-bold">
                  {e.username}
                  {e.result === "Champion" && <span className="ml-1">🏆</span>}
                </div>
                <div className="truncate text-xs text-white/40">
                  {e.formation} · {e.players.slice(0, 6).join(" · ")}…
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-soccer">{e.result}</div>
                <div className="text-[11px] text-white/30">{fmtDate(e.created_at)}</div>
              </div>
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  rank,
  accent,
  children,
}: {
  rank: number;
  accent: string;
  children: React.ReactNode;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(rank * 0.02, 0.3) }}
      className="card flex items-center gap-3 p-3"
    >
      <div className="w-8 text-center text-sm font-black text-white/40">
        {medal || rank}
      </div>
      {children}
    </motion.div>
  );
}

function Empty({ accent }: { accent: string }) {
  return (
    <div className="card p-10 text-center text-white/40">
      <p className="text-4xl">🏟️</p>
      <p className="mt-3 font-semibold">No results yet</p>
      <p className="mt-1 text-sm">Be the first to draft a dynasty and claim the top spot.</p>
    </div>
  );
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
