"use client";

import { useMemo, useState } from "react";

export interface EditorPack {
  sport: "nba" | "soccer";
  id: string;
  name: string;
  emoji: string;
  price: number;
  guarantee?: string;
  overridden: boolean;
  weights: Record<string, number>;
}

const fieldName = (p: EditorPack, r: string) => `w:${p.sport}:${p.id}:${r}`;

export function PackOddsEditor({ packs, rarities }: { packs: EditorPack[]; rarities: string[] }) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    for (const p of packs) for (const r of rarities) v[fieldName(p, r)] = p.weights[r] ?? 0;
    return v;
  });

  const bySport = useMemo(() => {
    const groups: Record<string, EditorPack[]> = {};
    for (const p of packs) (groups[p.sport] ??= []).push(p);
    return groups;
  }, [packs]);

  const set = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: Math.max(0, Number(val) || 0) }));

  return (
    <form method="post" action="/api/admin/odds">
      <input type="hidden" name="action" value="save" />

      {Object.entries(bySport).map(([sport, sportPacks]) => (
        <div key={sport} className="mb-8">
          <h2 className="mb-3 text-lg font-black capitalize">
            {sport === "nba" ? "🏀 NBA" : "⚽ Soccer"}
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {sportPacks.map((p) => {
              const total =
                rarities.reduce((a, r) => a + (values[fieldName(p, r)] || 0), 0) || 1;
              return (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-panel/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-bold">
                      {p.emoji} {p.name}
                    </div>
                    {p.overridden && (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                        overridden
                      </span>
                    )}
                  </div>
                  <div className="mb-2 text-[11px] text-white/40">
                    {p.price.toLocaleString()} coins{p.guarantee ? ` · guarantees ${p.guarantee}+` : ""}
                  </div>
                  <div className="space-y-1.5">
                    {rarities.map((r) => {
                      const key = fieldName(p, r);
                      const w = values[key] || 0;
                      const pct = Math.round((w / total) * 1000) / 10;
                      return (
                        <div key={r} className="flex items-center gap-2">
                          <span className="w-16 text-xs font-semibold text-white/60">{r}</span>
                          <input
                            type="number"
                            min={0}
                            step="0.5"
                            name={key}
                            value={w}
                            onChange={(e) => set(key, e.target.value)}
                            className="w-16 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-right text-sm text-white outline-none focus:border-white/30"
                          />
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-emerald-400/70" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-12 text-right text-xs tabular-nums text-white/70">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-ink/90 px-4 py-3 backdrop-blur">
        <button
          type="submit"
          className="rounded-lg bg-white px-5 py-2 font-bold text-black transition hover:bg-white/90"
        >
          Save odds (this browser)
        </button>
        <span className="text-xs text-white/40">
          Percentages update live above; nothing is stored until you save.
        </span>
      </div>
    </form>
  );
}
