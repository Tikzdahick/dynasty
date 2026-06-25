"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/lib/myteam/cards";
import { PlayerCard } from "@/components/myteam/PlayerCard";
import { AnimatedNumber } from "@/components/myteam/AnimatedNumber";
import { getOwned, getLineup, setLineup, OwnedCard } from "@/lib/store/myteam";
import { resolveCard } from "@/lib/store/upgrades";
import { computeTeamChemistry, CHEM_COLORS } from "@/lib/myteam/teamChemistry";
import {
  Lineup,
  STARTER_SLOTS,
  teamOverall,
  emptyLineup,
} from "@/lib/myteam/lineup";

type Slot = { kind: "starter" | "bench"; index: number };

export default function TeamBuilderPage() {
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [lineup, setLine] = useState<Lineup>(emptyLineup());
  const [picker, setPicker] = useState<Slot | null>(null);

  useEffect(() => {
    setOwned(getOwned());
    setLine(getLineup());
  }, []);

  // persist on every change (after the initial load)
  useEffect(() => {
    setLineup(lineup);
  }, [lineup]);

  // unique owned cards (one entry per card id, regardless of duplicates)
  const ownedCards = useMemo(() => {
    const seen = new Set<string>();
    const out: Card[] = [];
    for (const o of owned) {
      if (seen.has(o.cardId)) continue;
      const c = resolveCard(o.cardId);
      if (c) {
        seen.add(o.cardId);
        out.push(c);
      }
    }
    return out.sort((a, b) => b.overall - a.overall);
  }, [owned]);

  const usedIds = useMemo(
    () => new Set([...lineup.starters, ...lineup.bench].filter(Boolean) as string[]),
    [lineup]
  );

  const startersCards = lineup.starters
    .map((id) => (id ? resolveCard(id) : undefined))
    .filter(Boolean) as Card[];
  const benchCards = lineup.bench
    .map((id) => (id ? resolveCard(id) : undefined))
    .filter(Boolean) as Card[];

  const chem = computeTeamChemistry(startersCards);
  const ovr = teamOverall(startersCards, benchCards) + chem.bonus;
  const startersFilled = startersCards.length;

  const assign = (slot: Slot, cardId: string) => {
    setLine((prev) => {
      const next: Lineup = {
        starters: [...prev.starters],
        bench: [...prev.bench],
      };
      // a card can only occupy one slot — clear any prior placement
      next.starters = next.starters.map((id) => (id === cardId ? null : id));
      next.bench = next.bench.map((id) => (id === cardId ? null : id));
      const key = slot.kind === "starter" ? "starters" : "bench";
      next[key][slot.index] = cardId;
      return next;
    });
    setPicker(null);
  };

  const clear = (slot: Slot) => {
    setLine((prev) => {
      const next: Lineup = { starters: [...prev.starters], bench: [...prev.bench] };
      const key = slot.kind === "starter" ? "starters" : "bench";
      next[key][slot.index] = null;
      return next;
    });
  };

  // eligible cards for the open picker slot
  const pickerOptions = useMemo(() => {
    if (!picker) return [];
    const pos = picker.kind === "starter" ? STARTER_SLOTS[picker.index] : null;
    const key = picker.kind === "starter" ? "starters" : "bench";
    return ownedCards.filter((c) => {
      const current = lineup[key][picker.index];
      if (usedIds.has(c.id) && c.id !== current) return false;
      if (pos && c.position !== pos) return false;
      return true;
    });
  }, [picker, ownedCards, usedIds, lineup]);

  return (
    <div className="bg-grain">
      {/* header + team OVR */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/myteam" className="text-sm text-white/40 hover:text-white">
            ← MyTeam
          </Link>
          <h1 className="mt-1 text-3xl font-black">Team Builder</h1>
          <p className="text-sm text-white/50">
            Pick your starting five and bench from your collection.
          </p>
        </div>
        <div className="flex items-center gap-4 self-start rounded-2xl border border-white/10 bg-panel/70 px-5 py-3">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Team OVR</div>
            <div className="text-4xl font-black tabular-nums text-nba">
              {ovr ? <AnimatedNumber value={ovr} /> : "—"}
            </div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Chemistry</div>
            <div className={`text-lg font-bold ${CHEM_COLORS[chem.label]}`}>
              {chem.label === "None" ? "—" : chem.label}
            </div>
            <div className="text-[10px] tabular-nums text-white/40">
              {chem.rating}{chem.bonus > 0 ? ` · +${chem.bonus} OVR` : ""}
            </div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Starters</div>
            <div className="text-lg font-bold tabular-nums">
              {startersFilled}<span className="text-white/30">/5</span>
            </div>
          </div>
        </div>
      </div>

      {chem.groups.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/50">
          <span className="text-white/40">Chemistry links:</span>
          {chem.groups.map((g) => (
            <span key={g.team} className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-semibold text-emerald-300">
              {g.team} ×{g.count}
            </span>
          ))}
        </div>
      )}

      {ownedCards.length === 0 ? (
        <div className="card p-10 text-center text-sm text-white/45">
          You don&apos;t own any cards yet.{" "}
          <Link href="/myteam" className="text-nba underline">
            Open a pack
          </Link>{" "}
          to start building.
        </div>
      ) : (
        <>
          {/* Starting five */}
          <h2 className="mb-3 text-lg font-bold">Starting Five</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {STARTER_SLOTS.map((pos, i) => (
              <SlotView
                key={pos}
                label={pos}
                cardId={lineup.starters[i]}
                onPick={() => setPicker({ kind: "starter", index: i })}
                onClear={() => clear({ kind: "starter", index: i })}
              />
            ))}
          </div>

          {/* Bench */}
          <h2 className="mb-3 mt-8 text-lg font-bold">Bench</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {lineup.bench.map((cardId, i) => (
              <SlotView
                key={i}
                label="BENCH"
                cardId={cardId}
                onPick={() => setPicker({ kind: "bench", index: i })}
                onClear={() => clear({ kind: "bench", index: i })}
              />
            ))}
          </div>
        </>
      )}

      {/* picker modal */}
      <AnimatePresence>
        {picker && (
          <PickerModal
            title={
              picker.kind === "starter"
                ? `Choose ${STARTER_SLOTS[picker.index]}`
                : "Choose bench player"
            }
            options={pickerOptions}
            onSelect={(id) => assign(picker, id)}
            onClose={() => setPicker(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SlotView({
  label,
  cardId,
  onPick,
  onClear,
}: {
  label: string;
  cardId: string | null;
  onPick: () => void;
  onClear: () => void;
}) {
  const card = cardId ? resolveCard(cardId) : undefined;
  return (
    <div>
      <div className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-white/40">
        {label}
      </div>
      {card ? (
        <div className="relative">
          <PlayerCard card={card} size="sm" onClick={onPick} />
          <button
            onClick={onClear}
            aria-label="Remove player"
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-black text-white shadow hover:bg-red-400"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={onPick}
          className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-panel/40 text-white/40 transition hover:border-nba/50 hover:text-nba"
        >
          <span className="text-2xl">＋</span>
          <span className="mt-1 text-xs font-semibold">Add player</span>
        </button>
      )}
    </div>
  );
}

function PickerModal({
  title,
  options,
  onSelect,
  onClose,
}: {
  title: string;
  options: Card[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-t-3xl border border-white/10 bg-ink/95 p-5 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            ✕
          </button>
        </div>
        {options.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/45">
            No eligible cards for this slot.{" "}
            <Link href="/myteam" className="text-nba underline">
              Open more packs
            </Link>
            .
          </div>
        ) : (
          <div className="grid max-h-[64vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
            {options.map((c) => (
              <PlayerCard key={c.id} card={c} size="sm" onClick={() => onSelect(c.id)} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
