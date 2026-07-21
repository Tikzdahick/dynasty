"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlayerCard } from "@/components/myteam/PlayerCard";
import {
  getLiveMoment,
  getUpcomingMoments,
  momentPrice,
  LiveMoment,
  UpcomingMoment,
} from "@/lib/myteam/moments";
import { getCoins, getOwned, spendCoins, addOwned } from "@/lib/store/myteam";
import { logPackOpen } from "@/lib/store/packHistory";
import { useAuth } from "@/lib/auth";
import { grantRequest, resync } from "@/lib/store/cloud";

function fmt(ms: number): string {
  if (ms <= 0) return "ended";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2, "0")}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

export default function MomentsPage() {
  const { user } = useAuth();
  const [now, setNow] = useState(() => Date.now());
  const [live, setLive] = useState<LiveMoment | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingMoment[]>([]);
  const [coins, setCoins] = useState(0);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLive(getLiveMoment());
    setUpcoming(getUpcomingMoments(3));
    setCoins(getCoins());
    setOwned(new Set(getOwned().map((o) => o.cardId)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const flash = (text: string, ms = 2600) => {
    setMsg(text);
    setTimeout(() => setMsg(null), ms);
  };

  const claim = async () => {
    if (!live) return;
    if (owned.has(live.card.id)) return;
    const success = `🔥 ${live.card.name} — ${live.card.momentTitle} added!`;

    if (user) {
      // server deducts the moment price + grants the card atomically
      const res = await grantRequest({ type: "moment", sport: "nba", cardId: live.card.id });
      if (res.error) {
        flash(
          res.error === "insufficient balance"
            ? "Not enough coins for this Moment."
            : res.error === "already owned"
            ? "You already own this card."
            : "Couldn't buy that Moment — try again.",
          2400
        );
        return;
      }
      await resync("nba");
      logPackOpen(`Moment: ${live.card.momentTitle}`, [live.card.id]);
      refresh();
      flash(success);
      return;
    }

    // guest → local
    const price = momentPrice(live.card);
    if (coins < price) {
      flash("Not enough coins for this Moment.", 2200);
      return;
    }
    spendCoins(price);
    addOwned([live.card.id]);
    logPackOpen(`Moment: ${live.card.momentTitle}`, [live.card.id]);
    refresh();
    flash(success);
  };

  return (
    <div className="bg-grain">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <Link href="/myteam" className="text-sm text-white/40 hover:text-white">
            ← MyTeam
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-black">🔥 Moments</h1>
          <p className="text-sm text-white/50">
            Limited-time cards of historic performances. Gone when the timer hits zero.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-2">
          <span className="text-xl">🪙</span>
          <span className="text-xl font-black tabular-nums text-amber-300">{coins.toLocaleString()}</span>
        </div>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-200">
          {msg}
        </div>
      )}

      {/* live moment */}
      {live && (
        <div className="card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-[80px]" />
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch">
            <motion.div initial={{ rotateY: 30, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}>
              <PlayerCard card={live.card} size="lg" />
            </motion.div>
            <div className="flex flex-1 flex-col justify-center text-center sm:text-left">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">
                Live now
              </div>
              <h2 className="mt-1 text-2xl font-black">{live.card.momentTitle}</h2>
              <p className="text-white/60">
                {live.card.name} · {live.card.overall} OVR · {live.card.era}
              </p>
              <div className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300 sm:self-start">
                ⏳ <span className="font-bold tabular-nums">{fmt(live.endsAt - now)}</span> left
              </div>
              <div className="mt-4">
                {owned.has(live.card.id) ? (
                  <span className="inline-block rounded-xl bg-emerald-400/15 px-5 py-2.5 font-bold text-emerald-300">
                    Owned ✓
                  </span>
                ) : (
                  <button
                    onClick={claim}
                    disabled={coins < momentPrice(live.card)}
                    className="btn bg-fuchsia-500 px-6 text-white hover:bg-fuchsia-400 disabled:opacity-40"
                  >
                    Claim for 🪙 {momentPrice(live.card).toLocaleString()}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* upcoming */}
      <h2 className="mb-3 mt-8 text-lg font-bold">Dropping soon</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {upcoming.map((u) => (
          <div key={u.card.id} className="card flex items-center gap-3 p-3 opacity-80">
            <div className="w-16 shrink-0 blur-[1px]">
              <PlayerCard card={u.card} size="sm" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{u.card.momentTitle}</div>
              <div className="truncate text-xs text-white/45">{u.card.name}</div>
              <div className="mt-1 text-[11px] text-fuchsia-300">in {fmt(u.startsAt - now)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
