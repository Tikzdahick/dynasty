"use client";

export function ModePicker({
  accent,
  onClassic,
  onSpin,
}: {
  accent: "nba" | "soccer";
  onClassic: () => void;
  onSpin: () => void;
}) {
  const color = accent === "nba" ? "nba" : "soccer";
  return (
    <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
      <button
        onClick={onClassic}
        className={`group rounded-2xl border border-white/10 bg-panel p-6 text-left transition hover:-translate-y-1 ${
          color === "nba" ? "hover:border-nba/50" : "hover:border-soccer/50"
        }`}
      >
        <div className="text-4xl">📋</div>
        <h3 className="mt-3 text-xl font-bold">Classic Draft</h3>
        <p className="mt-1 text-sm text-white/55">
          Free pick from the entire all-time pool under the salary cap.
        </p>
        <span className="mt-4 inline-block text-sm font-semibold text-white/80 group-hover:translate-x-1">
          Start →
        </span>
      </button>
      <button
        onClick={onSpin}
        className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-panel p-6 text-left transition hover:-translate-y-1 ${
          color === "nba" ? "hover:border-nba/50" : "hover:border-soccer/50"
        }`}
      >
        <div
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${
            color === "nba" ? "from-nba/20" : "from-soccer/20"
          } to-transparent opacity-70`}
        />
        <div className="text-4xl">🎰</div>
        <h3 className="mt-3 text-xl font-bold">Decade + Team Spin</h3>
        <p className="mt-1 text-sm text-white/55">
          Spin for a random decade &amp; team. The star is auto-locked — draft
          their real roster.
        </p>
        <span className="mt-4 inline-block text-sm font-semibold text-white/80 group-hover:translate-x-1">
          Spin →
        </span>
      </button>
    </div>
  );
}
