"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlayerCard } from "@/components/myteam/PlayerCard";
import { cardById, Rarity, RARITY_ORDER } from "@/lib/myteam/cards";
import { getPackHistory, PackHistoryEntry } from "@/lib/store/packHistory";

type RarityFilter = "All" | Rarity;
type DateFilter = "All" | "Today" | "7d";

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function PackHistoryPage() {
  const [entries, setEntries] = useState<PackHistoryEntry[]>([]);
  const [rarity, setRarity] = useState<RarityFilter>("All");
  const [date, setDate] = useState<DateFilter>("All");

  useEffect(() => {
    setEntries(getPackHistory());
  }, []);

  const filtered = useMemo(() => {
    const since =
      date === "Today" ? startOfToday() : date === "7d" ? Date.now() - 7 * 86_400_000 : 0;
    return entries
      .filter((e) => e.ts >= since)
      .map((e) => {
        const cards = e.cardIds
          .map((id) => cardById(id))
          .filter((c) => c && (rarity === "All" || c.rarity === rarity));
        return { ...e, cards };
      })
      .filter((e) => e.cards.length > 0);
  }, [entries, rarity, date]);

  return (
    <div className="bg-grain">
      <div className="mb-5">
        <Link href="/myteam" className="text-sm text-white/40 hover:text-white">
          ← MyTeam
        </Link>
        <h1 className="mt-1 text-3xl font-black">📜 Pack History</h1>
        <p className="text-sm text-white/50">Every pack you&apos;ve opened and what you pulled.</p>
      </div>

      {/* filters */}
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterGroup
          options={["All", ...RARITY_ORDER] as RarityFilter[]}
          value={rarity}
          onChange={setRarity}
        />
        <div className="w-px self-stretch bg-white/10" />
        <FilterGroup
          options={["All", "Today", "7d"] as DateFilter[]}
          value={date}
          onChange={setDate}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-white/45">
          No openings match these filters yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className="card p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-white/45">
                <span className="font-semibold text-white/70">{e.source}</span>
                <span>{new Date(e.ts).toLocaleString()}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {e.cards.map((c, i) => (
                  <div key={i} className="w-16">
                    <PlayerCard card={c} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === o ? "bg-white/15 text-white" : "bg-panel/60 text-white/55 hover:text-white"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
