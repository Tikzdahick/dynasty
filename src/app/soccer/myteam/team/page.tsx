"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FormationName, SoccerPosition } from "@/types";
import { Card } from "@/lib/soccer-myteam/cards";
import { PlayerCard } from "@/components/soccer-myteam/PlayerCard";
import { AnimatedNumber } from "@/components/myteam/AnimatedNumber";
import { getOwned, getLineup, setLineup, OwnedCard } from "@/lib/store/soccer/myteam";
import { resolveCard } from "@/lib/store/soccer/upgrades";
import { computeTeamChemistry, CHEM_COLORS, CHEM_KIND_ICON } from "@/lib/soccer-myteam/teamChemistry";
import {
  Lineup,
  FORMATION_NAMES,
  starterSlots,
  reslotStarters,
  teamOverall,
  emptyLineup,
} from "@/lib/soccer-myteam/lineup";
import { formationCounts } from "@/lib/soccer/formations";

type Slot = { kind: "starter" | "bench"; index: number };

// Pitch rows for the current formation. Slots are ordered GK → DEF → MID → FWD,
// so each line is a contiguous range of the starters array.
function rowsFor(formation: FormationName): { label: string; range: [number, number] }[] {
  const counts = formationCounts(formation);
  const order: { pos: SoccerPosition; label: string }[] = [
    { pos: "GK", label: "Goalkeeper" },
    { pos: "DEF", label: "Defence" },
    { pos: "MID", label: "Midfield" },
    { pos: "FWD", label: "Attack" },
  ];
  const rows: { label: string; range: [number, number] }[] = [];
  let start = 0;
  for (const { pos, label } of order) {
    const n = counts[pos];
    if (n > 0) {
      rows.push({ label, range: [start, start + n] });
      start += n;
    }
  }
  return rows;
}

export default function SquadBuilderPage() {
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [lineup, setLine] = useState<Lineup>(emptyLineup());
  const [picker, setPicker] = useState<Slot | null>(null);

  useEffect(() => {
    setOwned(getOwned());
    setLine(getLineup());
  }, []);

  useEffect(() => {
    setLineup(lineup);
  }, [lineup]);

  const slots = starterSlots(lineup.formation);
  const rows = rowsFor(lineup.formation);

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

  const changeFormation = (f: FormationName) => {
    setLine((prev) => {
      if (prev.formation === f) return prev;
      const starters = reslotStarters(
        prev.starters,
        prev.formation,
        f,
        (id) => resolveCard(id)?.position
      );
      return { ...prev, formation: f, starters };
    });
  };

  const assign = (slot: Slot, cardId: string) => {
    setLine((prev) => {
      const next: Lineup = {
        ...prev,
        starters: [...prev.starters],
        bench: [...prev.bench],
      };
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
      const next: Lineup = { ...prev, starters: [...prev.starters], bench: [...prev.bench] };
      const key = slot.kind === "starter" ? "starters" : "bench";
      next[key][slot.index] = null;
      return next;
    });
  };

  const pickerOptions = useMemo(() => {
    if (!picker) return [];
    const pos = picker.kind === "starter" ? slots[picker.index] : null;
    const key = picker.kind === "starter" ? "starters" : "bench";
    return ownedCards.filter((c) => {
      const current = lineup[key][picker.index];
      if (usedIds.has(c.id) && c.id !== current) return false;
      if (pos && c.position !== pos) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker, ownedCards, usedIds, lineup, slots]);

  return (
    <div className="bg-grain">
      {/* header + team OVR */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/soccer/myteam" className="text-sm text-white/40 hover:text-white">
            ← Soccer MyTeam
          </Link>
          <h1 className="mt-1 text-3xl font-black">Squad Builder</h1>
          <p className="text-sm text-white/50">
            Pick a formation, then fill your XI ({lineup.formation}) and subs from your collection.
          </p>
        </div>
        <div className="flex items-center gap-4 self-start rounded-2xl border border-white/10 bg-panel/70 px-5 py-3">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Team OVR</div>
            <div className="text-4xl font-black tabular-nums text-soccer">
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
            <div className="text-[10px] uppercase tracking-widest text-white/40">XI</div>
            <div className="text-lg font-bold tabular-nums">
              {startersFilled}<span className="text-white/30">/11</span>
            </div>
          </div>
        </div>
      </div>

      {/* formation picker */}
      <div className="mb-6">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/35">
          Formation
        </div>
        <div className="flex flex-wrap gap-2">
          {FORMATION_NAMES.map((f) => (
            <button
              key={f}
              onClick={() => changeFormation(f)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold tabular-nums transition ${
                lineup.formation === f
                  ? "border-soccer bg-soccer/10 text-soccer"
                  : "border-white/10 bg-panel text-white/60 hover:border-soccer/40 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {chem.groups.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/50">
          <span className="text-white/40">Chemistry links:</span>
          {chem.groups.map((g) => (
            <span
              key={`${g.kind}-${g.team}`}
              className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-semibold text-emerald-300"
            >
              {g.kind ? `${CHEM_KIND_ICON[g.kind]} ` : ""}{g.team} ×{g.count}
            </span>
          ))}
        </div>
      )}

      {ownedCards.length === 0 ? (
        <div className="card p-10 text-center text-sm text-white/45">
          You don&apos;t own any cards yet.{" "}
          <Link href="/soccer/myteam" className="text-soccer underline">
            Open a pack
          </Link>{" "}
          to start building.
        </div>
      ) : (
        <>
          {/* Starting XI, by pitch row */}
          <h2 className="mb-3 text-lg font-bold">Starting XI</h2>
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.label}>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/35">
                  {row.label}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {slots.slice(row.range[0], row.range[1]).map((pos, k) => {
                    const i = row.range[0] + k;
                    return (
                      <SlotView
                        key={i}
                        label={pos}
                        cardId={lineup.starters[i]}
                        onPick={() => setPicker({ kind: "starter", index: i })}
                        onClear={() => clear({ kind: "starter", index: i })}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Subs bench */}
          <h2 className="mb-3 mt-8 text-lg font-bold">Substitutes</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {lineup.bench.map((cardId, i) => (
              <SlotView
                key={i}
                label="SUB"
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
                ? `Choose ${slots[picker.index]}`
                : "Choose substitute"
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
          className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-panel/40 text-white/40 transition hover:border-soccer/50 hover:text-soccer"
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
            <Link href="/soccer/myteam" className="text-soccer underline">
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
