"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PACKS, openPack, PackDef } from "@/lib/myteam/packs";
import { Card } from "@/lib/myteam/cards";
import { RARITY_TIERS, starterPackForTeam } from "@/lib/myteam/cards";
import { PlayerCard } from "@/components/myteam/PlayerCard";
import { PackOpening } from "@/components/myteam/PackOpening";
import { DailyRewardModal } from "@/components/myteam/DailyRewardModal";
import { StarterPackOnboarding } from "@/components/myteam/StarterPackOnboarding";
import { NotificationBell } from "@/components/myteam/NotificationBell";
import {
  ensureInit,
  getCoins,
  getOwned,
  spendCoins,
  addOwned,
  isOnboarded,
  markOnboarded,
  OwnedCard,
} from "@/lib/store/myteam";
import { resolveCard } from "@/lib/store/upgrades";
import { getDailyStatus } from "@/lib/store/dailyReward";
import { onPackOpened } from "@/lib/myteam/events";
import { pushNotification } from "@/lib/store/notifications";
import { consumeNewMomentDrop } from "@/lib/myteam/moments";
import { botRivals } from "@/lib/myteam/leaderboard";

const RIVAL_PINGED_KEY = "dynasty.rivalping.shownSession";

const DAILY_SHOWN_KEY = "dynasty.dailyreward.shownSession";

const HUB_LINKS = [
  { href: "/myteam/team", label: "🏀 Team Builder" },
  { href: "/myteam/rivals", label: "⚔️ Rivals" },
  { href: "/myteam/leaderboard", label: "🏆 Leaderboard" },
  { href: "/myteam/auction", label: "🏛 Auction House" },
  { href: "/myteam/season", label: "🎖 Season Pass" },
  { href: "/myteam/challenges", label: "🎯 Challenges" },
  { href: "/myteam/moments", label: "🔥 Moments" },
  { href: "/myteam/squads", label: "🌍 Squads" },
  { href: "/myteam/upgrades", label: "🔧 Upgrades" },
  { href: "/myteam/history", label: "📜 Pack History" },
];

export default function MyTeamPage() {
  const [coins, setCoins] = useState(0);
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [opening, setOpening] = useState<Card[] | null>(null);
  const [openingSource, setOpeningSource] = useState("Pack");
  const [error, setError] = useState<string | null>(null);
  const [showDaily, setShowDaily] = useState(false);
  const [dailyClaimable, setDailyClaimable] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);

  useEffect(() => {
    ensureInit();
    refresh();
    // brand-new player → run the Starter Pack onboarding first
    if (!isOnboarded() && getOwned().length === 0) {
      setShowOnboard(true);
      return;
    }
    // otherwise surface the daily reward once per browser session if claimable
    const claimable = getDailyStatus().canClaim;
    setDailyClaimable(claimable);
    if (claimable) pushNotification("daily", "Your daily reward is ready to claim!");
    if (claimable && !sessionStorage.getItem(DAILY_SHOWN_KEY)) {
      sessionStorage.setItem(DAILY_SHOWN_KEY, "1");
      setShowDaily(true);
    }
    // notify on a fresh Moments drop
    const drop = consumeNewMomentDrop();
    if (drop) pushNotification("moment", `New Moment dropped: ${drop.name} — ${drop.momentTitle}!`);

    // occasional incoming rival challenge (once per session)
    if (!sessionStorage.getItem(RIVAL_PINGED_KEY)) {
      sessionStorage.setItem(RIVAL_PINGED_KEY, "1");
      if (Math.random() < 0.6) {
        const rivals = botRivals();
        const r = rivals[Math.floor(Math.random() * rivals.length)];
        pushNotification("rival", `${r.username} challenged you! Respond on the Rivals page.`);
      }
    }
  }, []);

  function chooseTeam(teamId: string) {
    markOnboarded(teamId);
    setShowOnboard(false);
    // reveal the starter cards via the existing pack-opening flow (which adds them)
    const starter = starterPackForTeam(teamId);
    setOpeningSource("Starter Pack");
    if (starter.length > 0) setOpening(starter);
    else refresh(); // defensive: never open an empty reveal
  }

  function refresh() {
    setCoins(getCoins());
    setOwned(getOwned());
  }

  function buy(pack: PackDef) {
    setError(null);
    const bal = spendCoins(pack.price);
    if (bal == null) {
      setError("Not enough Dynasty Coins for that pack.");
      return;
    }
    setCoins(bal);
    setOpeningSource(pack.name);
    setOpening(openPack(pack));
  }

  function finishOpening() {
    if (opening) {
      addOwned(opening.map((c) => c.id));
      onPackOpened(openingSource, opening); // XP + challenges + pack history
    }
    setOpening(null);
    refresh();
  }

  function onDailyClaimed() {
    // grant already applied in the modal; just sync UI + button state
    refresh();
    setDailyClaimable(getDailyStatus().canClaim);
  }

  // group owned instances by card, newest collections sorted by overall
  const collection = useMemo(() => {
    const map = new Map<string, { card: Card; count: number }>();
    for (const o of owned) {
      const card = resolveCard(o.cardId);
      if (!card) continue;
      const e = map.get(o.cardId);
      if (e) e.count++;
      else map.set(o.cardId, { card, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.card.overall - a.card.overall);
  }, [owned]);

  return (
    <div className="bg-grain">
      {showOnboard && <StarterPackOnboarding onPick={chooseTeam} />}
      {opening && <PackOpening cards={opening} onDone={finishOpening} />}
      {showDaily && (
        <DailyRewardModal onClose={() => setShowDaily(false)} onClaimed={onDailyClaimed} />
      )}

      {/* header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="text-sm text-white/40 hover:text-white">
            ← Home
          </Link>
          <h1 className="mt-1 text-3xl font-black">
            <span className="bg-gradient-to-r from-nba via-amber-300 to-fuchsia-400 bg-clip-text text-transparent">
              MyTeam
            </span>
          </h1>
          <p className="text-sm text-white/50">Open packs, collect legends, build your dynasty.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <NotificationBell />
          <button
            onClick={() => setShowDaily(true)}
            className={`btn relative text-sm ${
              dailyClaimable
                ? "bg-amber-400 text-black hover:bg-amber-300"
                : "border border-white/10 bg-panel/70 text-white/80 hover:bg-white/5"
            }`}
          >
            🎁 Daily
            {dailyClaimable && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-2">
            <span className="text-xl">🪙</span>
            <span className="text-xl font-black tabular-nums text-amber-300">{coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* hub nav */}
      <div className="mb-6 flex flex-wrap gap-2">
        {HUB_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-white/10 bg-panel/60 px-3 py-1.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* pack store */}
      <h2 className="mb-3 text-lg font-bold">Store</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {PACKS.map((pack, i) => {
          const afford = coins >= pack.price;
          return (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card flex flex-col p-5"
            >
              <div className="text-4xl">{pack.emoji}</div>
              <h3 className={`mt-2 text-xl font-bold ${pack.accent}`}>{pack.name}</h3>
              <p className="mt-1 flex-1 text-sm text-white/55">{pack.blurb}</p>
              <div className="mt-3 text-xs text-white/40">
                {pack.size} cards{pack.guarantee ? ` · guaranteed ${pack.guarantee}+` : ""}
              </div>
              <button
                onClick={() => buy(pack)}
                disabled={!afford}
                className="btn mt-3 w-full bg-amber-400 text-black hover:bg-amber-300 disabled:bg-white/10 disabled:text-white/40"
              >
                🪙 {pack.price.toLocaleString()}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* collection */}
      <div className="mt-10 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Collection <span className="text-sm font-normal text-white/40">({owned.length})</span>
        </h2>
        {collection.length > 0 && <RaritySummary collection={collection} />}
      </div>

      {collection.length === 0 ? (
        <div className="card p-10 text-center text-sm text-white/45">
          No cards yet. Open a pack above to start your collection.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {collection.map(({ card, count }) => (
            <div key={card.id} className="relative">
              <PlayerCard card={card} size="sm" />
              {count > 1 && (
                <span className="absolute -right-1.5 -top-1.5 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-black">
                  ×{count}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RaritySummary({ collection }: { collection: { card: Card; count: number }[] }) {
  const counts = collection.reduce<Record<string, number>>((acc, { card, count }) => {
    if (!card) return acc;
    acc[card.rarity] = (acc[card.rarity] ?? 0) + count;
    return acc;
  }, {});
  const order = ["Dynasty", "Diamond", "Gold", "Silver", "Bronze"] as const;
  return (
    <div className="flex flex-wrap gap-1.5">
      {order
        .filter((r) => counts[r])
        .map((r) => (
          <span
            key={r}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RARITY_TIERS[r].chip}`}
          >
            {counts[r]} {r}
          </span>
        ))}
    </div>
  );
}
