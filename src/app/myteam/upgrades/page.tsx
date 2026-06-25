"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, cardById, applyUpgrade } from "@/lib/myteam/cards";
import { PlayerCard } from "@/components/myteam/PlayerCard";
import { getCoins, getOwned, spendCoins } from "@/lib/store/myteam";
import {
  getLevel,
  isUpgradeable,
  upgradeCost,
  canUpgrade,
  bumpLevel,
  MAX_LEVEL,
} from "@/lib/store/upgrades";
import { onCardUpgraded } from "@/lib/myteam/events";

export default function UpgradesPage() {
  const [coins, setCoins] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setCoins(getCoins());
    const seen = new Set<string>();
    const list: Card[] = [];
    for (const o of getOwned()) {
      if (seen.has(o.cardId)) continue;
      const c = cardById(o.cardId);
      if (c && isUpgradeable(c)) {
        seen.add(o.cardId);
        list.push(c);
      }
    }
    setCards(list.sort((a, b) => b.overall - a.overall));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selected = selectedId ? cardById(selectedId) : null;

  return (
    <div className="bg-grain">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <Link href="/myteam" className="text-sm text-white/40 hover:text-white">
            ← MyTeam
          </Link>
          <h1 className="mt-1 text-3xl font-black">🔧 Upgrades</h1>
          <p className="text-sm text-white/50">
            Spend coins to boost your Bronze &amp; Silver cards.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-2">
          <span className="text-xl">🪙</span>
          <span className="text-xl font-black tabular-nums text-amber-300">{coins.toLocaleString()}</span>
        </div>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-nba/40 bg-nba/10 px-4 py-2 text-sm text-nba">
          {msg}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="card p-10 text-center text-sm text-white/45">
          No upgradeable cards. Bronze and Silver cards can be improved here.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {cards.map((c) => {
            const lvl = getLevel(c.id);
            return (
              <div key={c.id} className="relative">
                <PlayerCard card={applyUpgrade(c, lvl)} size="sm" onClick={() => setSelectedId(c.id)} />
                {lvl > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 rounded-full bg-emerald-400 px-1.5 text-[10px] font-black text-black">
                    +{lvl}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <UpgradeModal
          card={selected}
          coins={coins}
          onClose={() => setSelectedId(null)}
          onUpgraded={(text) => {
            setMsg(text);
            setTimeout(() => setMsg(null), 2200);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function UpgradeModal({
  card,
  coins,
  onClose,
  onUpgraded,
}: {
  card: Card;
  coins: number;
  onClose: () => void;
  onUpgraded: (text: string) => void;
}) {
  const [level, setLevel] = useState(getLevel(card.id));
  const current = useMemo(() => applyUpgrade(card, level), [card, level]);
  const maxed = level >= MAX_LEVEL;
  const next = useMemo(() => (maxed ? current : applyUpgrade(card, level + 1)), [card, level, maxed, current]);
  const cost = upgradeCost(card, level);
  const affordable = coins >= cost;

  const doUpgrade = () => {
    if (maxed || !canUpgrade(card) || !affordable) return;
    spendCoins(cost);
    const newLevel = bumpLevel(card.id);
    onCardUpgraded();
    setLevel(newLevel);
    onUpgraded(`${card.name} upgraded to +${newLevel}!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-ink/95 p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Upgrade · {card.name}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="w-24"><PlayerCard card={current} size="sm" /></div>
            <div className="mt-1 text-xs text-white/45">Current +{level}</div>
          </div>
          <div className="text-2xl text-white/40">→</div>
          <div className="text-center">
            <div className="w-24"><PlayerCard card={next} size="sm" /></div>
            <div className="mt-1 text-xs text-emerald-300">{maxed ? "Maxed" : `Next +${level + 1}`}</div>
          </div>
        </div>

        {/* before/after stats */}
        <div className="mt-4 space-y-2">
          <StatRow label="Overall" from={current.overall} to={next.overall} />
          <StatRow label="Speed" from={current.speed} to={next.speed} />
          <StatRow label="Shooting" from={current.shooting} to={next.shooting} />
          <StatRow label="Defense" from={current.defense} to={next.defense} />
        </div>

        {maxed ? (
          <div className="mt-5 rounded-xl bg-white/5 py-3 text-center text-sm font-semibold text-emerald-300">
            Fully upgraded ✓
          </div>
        ) : (
          <button
            onClick={doUpgrade}
            disabled={!affordable}
            className="btn mt-5 w-full bg-nba text-black hover:bg-nba-gold disabled:opacity-40"
          >
            {affordable ? `Upgrade · 🪙 ${cost.toLocaleString()}` : `Need 🪙 ${cost.toLocaleString()}`}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatRow({ label, from, to }: { label: string; from: number; to: number }) {
  const up = to > from;
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 text-sm">
      <span className="text-white/55">{label}</span>
      <span className="flex items-center gap-2 font-semibold tabular-nums">
        <span className="text-white/70">{from}</span>
        {up && (
          <>
            <span className="text-white/30">→</span>
            <span className="text-emerald-300">{to}</span>
          </>
        )}
      </span>
    </div>
  );
}
