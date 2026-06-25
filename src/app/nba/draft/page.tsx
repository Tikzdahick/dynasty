"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RoundDraft, DraftMode } from "@/components/RoundDraft";
import { SlotDef } from "@/components/Court";
import { nbaDeck } from "@/lib/draft/candidates";
import { simulateSeason, teamRating } from "@/lib/nba/sim";
import { NbaPlayer, NbaSeasonResult } from "@/types";
import { useAuth } from "@/lib/auth";
import { saveNbaResult } from "@/lib/store/leaderboard";
import { computeChemistry, Chemistry } from "@/lib/chemistry";
import { PreSimSummary } from "@/components/PreSimSummary";
import { nbaIdentity } from "@/lib/identity";
import { nbaAwards } from "@/lib/awards";
import { nbaShareText } from "@/lib/share";
import { ResultExtras } from "@/components/ResultExtras";
import { evaluateNba } from "@/lib/achievements";
import { recordDailyPlay, currentStreak, unlock } from "@/lib/store/stats";
import { getLocalNba, getLocalSoccer } from "@/lib/store/local";

const NBA_SLOTS: SlotDef[] = [
  { id: "pg", position: "PG", label: "PG", x: 58, y: 26 },
  { id: "sg", position: "SG", label: "SG", x: 84, y: 46 },
  { id: "sf", position: "SF", label: "SF", x: 16, y: 46 },
  { id: "pf", position: "PF", label: "PF", x: 33, y: 70 },
  { id: "c", position: "C", label: "C", x: 64, y: 74 },
  { id: "b1", position: "ANY", label: "Bench", bench: true },
  { id: "b2", position: "ANY", label: "Bench", bench: true },
  { id: "b3", position: "ANY", label: "Bench", bench: true },
];

type Phase = "draft" | "summary" | "sim" | "done";
type GhostNba = NbaPlayer & { ghost?: boolean };

// Decoy ("ghost") players flash inflated stats during the draft but
// perform significantly worse once the season is simulated.
function weakenGhost(p: NbaPlayer | null): NbaPlayer {
  const g = p as GhostNba;
  if (!g?.ghost) return p as NbaPlayer;
  return {
    ...g,
    overall: Math.round(g.overall * 0.78),
    ppg: +(g.ppg * 0.78).toFixed(1),
    rpg: +(g.rpg * 0.78).toFixed(1),
    apg: +(g.apg * 0.78).toFixed(1),
  };
}

export default function NbaDraftPage() {
  const router = useRouter();
  const [mode, setMode] = useState<DraftMode | null>(null);
  const [timed, setTimed] = useState(false);
  const [phase, setPhase] = useState<Phase>("draft");
  const [placed, setPlaced] = useState<(NbaPlayer | null)[]>([]);
  const [roster, setRoster] = useState<NbaPlayer[]>([]);
  const [chemistry, setChemistry] = useState<Chemistry | null>(null);
  const [season, setSeason] = useState<NbaSeasonResult | null>(null);

  useEffect(() => {
    setMode((sessionStorage.getItem("dynasty.nba.mode") as DraftMode) || "classic");
    setTimed(sessionStorage.getItem("dynasty.nba.timer") === "1");
  }, []);

  const rating = (() => {
    const starters = placed.slice(0, 5).filter(Boolean).map(weakenGhost);
    const bench = placed.slice(5, 8).filter(Boolean).map(weakenGhost);
    return teamRating(starters, bench);
  })();

  const onConfirm = (next: (NbaPlayer | null)[]) => {
    const all = next.filter(Boolean) as NbaPlayer[];
    setPlaced(next);
    setRoster(all);
    setChemistry(computeChemistry("nba", all));
    setPhase("summary");
  };

  const simulate = () => {
    setSeason(simulateSeason(rating, chemistry?.pct ?? 0));
    setPhase("sim");
  };

  if (!mode) return null;

  return (
    <div className="bg-grain">
      {phase === "draft" && (
        <RoundDraft<NbaPlayer>
          variant="nba"
          accent="nba"
          slots={NBA_SLOTS}
          starterCount={5}
          benchCount={3}
          deck={nbaDeck}
          mode={mode}
          timed={timed}
          contextLabel={`NBA · ${labelFor(mode)}${timed ? " · ⏱ Timed" : ""}`}
          confirmLabel="Confirm roster →"
          onConfirm={onConfirm}
          onExit={() => router.push("/nba")}
        />
      )}
      {phase === "summary" && chemistry && (
        <PreSimSummary<NbaPlayer>
          variant="nba"
          accent="nba"
          slots={NBA_SLOTS}
          placed={placed}
          chemistry={chemistry}
          rating={rating}
          subtitle={`NBA · ${labelFor(mode)}`}
          onSimulate={simulate}
          onBack={() => setPhase("draft")}
        />
      )}
      {phase === "sim" && season && (
        <SeasonSim season={season} onDone={() => setPhase("done")} />
      )}
      {phase === "done" && season && (
        <SeasonResult
          season={season}
          roster={roster}
          mode={mode}
          chemistry={chemistry}
          onReset={() => router.push("/nba")}
        />
      )}
    </div>
  );
}

function labelFor(m: DraftMode): string {
  return m === "classic" ? "Classic" : m === "iq" ? "Hoop IQ" : m === "daily" ? "Daily Challenge" : "Team Draft";
}

/* ----------------------------- SIM ----------------------------- */
function SeasonSim({ season, onDone }: { season: NbaSeasonResult; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shown >= season.games.length) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    // linger dramatically on upset losses
    const justRevealed = season.games[shown - 1];
    const delay = justRevealed?.upset ? 900 : shown < 4 ? 260 : 70;
    const t = setTimeout(() => setShown((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [shown, season.games.length, onDone]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [shown]);

  const games = season.games.slice(0, shown);
  const wins = games.filter((g) => g.win).length;
  const losses = games.length - wins;

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-white/40">Simulating season</p>
      <div className="my-4 text-6xl font-black tabular-nums">
        <span className="text-nba">{wins}</span>
        <span className="text-white/30"> - </span>
        <span className="text-white/70">{losses}</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-gradient-to-r from-nba to-nba-gold transition-all" style={{ width: `${(shown / season.games.length) * 100}%` }} />
      </div>
      <div ref={listRef} className="card max-h-80 space-y-1.5 overflow-y-auto p-3 text-left">
        {games.map((g) => (
          <motion.div
            key={g.game}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              g.upset ? "bg-red-500/20 ring-1 ring-red-500/40" : g.win ? "bg-nba/10" : "bg-red-500/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-white/40">#{g.game}</span>
              <span className="flex-1 px-3 text-white/70">
                vs {g.opponent} {g.upset && <span className="text-red-400">· UPSET</span>}
              </span>
              <span className={`font-semibold tabular-nums ${g.upset ? "text-white/50" : ""}`}>
                {g.teamScore}–{g.oppScore}
              </span>
              <span className={`ml-3 w-5 text-center font-bold ${g.win ? "text-nba" : "text-red-400"}`}>
                {g.win ? "W" : "L"}
              </span>
            </div>
            {g.story && <div className="mt-0.5 pl-7 text-[11px] italic text-red-300/80">{g.story}</div>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- RESULT ----------------------------- */
function gradeFor(wins: number): string {
  if (wins === 82) return "S+";
  if (wins >= 78) return "S";
  if (wins >= 70) return "A";
  if (wins >= 60) return "B";
  if (wins >= 45) return "C";
  return "D";
}

function analyze(roster: NbaPlayer[]): { strengths: string[]; weaknesses: string[] } {
  if (roster.length === 0) return { strengths: [], weaknesses: [] };
  const avg = (k: "ppg" | "rpg" | "apg") => roster.reduce((a, p) => a + p[k], 0) / roster.length;
  const metrics = [
    { label: "Scoring", v: avg("ppg") / 25 },
    { label: "Rebounding", v: avg("rpg") / 9 },
    { label: "Playmaking", v: avg("apg") / 6 },
  ].sort((a, b) => b.v - a.v);
  return {
    strengths: metrics.slice(0, 1).map((m) => m.label),
    weaknesses: metrics.slice(-1).map((m) => m.label),
  };
}

function SeasonResult({
  season,
  roster,
  mode,
  chemistry,
  onReset,
}: {
  season: NbaSeasonResult;
  roster: NbaPlayer[];
  mode: DraftMode;
  chemistry: Chemistry | null;
  onReset: () => void;
}) {
  const { user, displayName, guestName, setGuestName } = useAuth();
  const [name, setName] = useState(displayName !== "Guest" ? displayName : guestName);
  const [saved, setSaved] = useState<"idle" | "saving" | "cloud" | "local">("idle");
  const undefeated = season.losses === 0;
  const grade = gradeFor(season.wins);
  const { strengths, weaknesses } = analyze(roster);
  const upsets = season.games.filter((g) => g.upset);

  const daily = mode === "daily";
  const identity = useMemo(() => nbaIdentity(roster, chemistry?.label), [roster, chemistry]);
  const awards = useMemo(() => nbaAwards(season, roster), [season, roster]);
  const [streak, setStreak] = useState(0);
  const [newAch, setNewAch] = useState<string[]>([]);
  const shareText = useMemo(
    () => nbaShareText({ season, grade, identity, mode: labelFor(mode), daily, streak }),
    [season, grade, identity, mode, daily, streak]
  );

  // record streak (daily only) + evaluate achievements once when the result mounts
  useEffect(() => {
    const s = daily ? recordDailyPlay().count : currentStreak();
    setStreak(s);
    const hadGhost = roster.some((p) => (p as GhostNba).ghost);
    const savedCount = getLocalNba().length + getLocalSoccer().length;
    const ids = evaluateNba({
      season,
      chem: chemistry?.label,
      mode,
      streak: s,
      savedCount,
      hadGhost,
    });
    setNewAch(unlock(ids));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!name.trim()) return;
    if (!user) setGuestName(name.trim());
    setSaved("saving");
    const res = await saveNbaResult({
      username: name.trim(),
      wins: season.wins,
      losses: season.losses,
      players: roster.map((p) => p.name),
      rating: season.teamRating,
      chemistry: chemistry?.label,
    });
    setSaved(res.saved);
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      {undefeated && <Confetti />}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">Final record · {labelFor(mode)}</p>
        <div className="my-3 text-7xl font-black tabular-nums">
          <span className="text-nba">{season.wins}</span>
          <span className="text-white/30">-</span>
          <span className="text-white/70">{season.losses}</span>
        </div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1">
          <span className="text-xs text-white/40">Grade</span>
          <span className="text-xl font-black text-nba-gold">{grade}</span>
        </div>
        <p className="text-lg font-semibold">
          {undefeated ? "🏆 PERFECT SEASON — 82-0!" : season.wins >= 70 ? "🔥 Historic season." : season.wins >= 50 ? "Solid playoff team." : "Rebuild incoming."}
        </p>
        <p className="mt-1 text-sm text-white/40">Team rating {season.teamRating}</p>
      </motion.div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-left text-sm">
        <div className="card p-3">
          <div className="text-xs uppercase text-white/40">Chemistry</div>
          <div className={`font-bold ${chemistry?.label === "Elite" ? "text-amber-300" : chemistry?.label === "Good" ? "text-emerald-300" : "text-white/50"}`}>
            {chemistry?.label ?? "—"}
          </div>
        </div>
        <div className="card p-3">
          <div className="text-xs uppercase text-white/40">Strength</div>
          <div className="font-bold text-nba">{strengths[0] ?? "—"}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs uppercase text-white/40">Weakness</div>
          <div className="font-bold text-red-400">{weaknesses[0] ?? "—"}</div>
        </div>
      </div>

      {upsets.length > 0 && (
        <div className="card mt-4 p-4 text-left">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300/80">
            Bad nights ({upsets.length})
          </div>
          <div className="space-y-1.5">
            {upsets.map((g) => (
              <div key={g.game} className="text-xs text-white/60">
                <span className="font-semibold text-white/80">L {g.teamScore}–{g.oppScore}</span>{" "}
                vs {g.opponent} — <span className="italic text-red-300/80">{g.story}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-4 p-4 text-left">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Your roster</div>
        <div className="flex flex-wrap gap-1.5">
          {roster.map((p) => {
            const ghost = (p as GhostNba).ghost;
            return (
              <span
                key={p.id}
                className={`rounded-lg px-2 py-1 text-xs ${ghost ? "bg-red-500/15 text-red-300 ring-1 ring-red-500/30" : "bg-white/5"}`}
              >
                {ghost && "🫥 "}
                {p.name}
              </span>
            );
          })}
        </div>
        {roster.some((p) => (p as GhostNba).ghost) && (
          <p className="mt-2 text-[11px] italic text-red-300/70">
            🫥 Ghost busted — a decoy you drafted played well below its flashy card.
          </p>
        )}
      </div>

      <div className="mt-4">
        <ResultExtras
          accent="nba"
          identity={identity}
          awards={awards}
          shareText={shareText}
          newAchievements={newAch}
          streak={streak}
        />
      </div>

      <div className="card mt-4 p-4">
        {saved === "cloud" || saved === "local" ? (
          <div className="text-sm">
            <p className="font-semibold text-nba">Saved to leaderboard ✓</p>
            <p className="mt-1 text-white/40">
              {saved === "local" ? "Stored on this device. Sign in to save to the global board." : "Posted to the global leaderboard."}
            </p>
            <Link href="/leaderboard" className="btn-ghost mt-3 w-full">View leaderboard →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="flex-1 rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-sm outline-none focus:border-nba/60" />
            <button onClick={save} disabled={!name.trim() || saved === "saving"} className="btn bg-nba text-black hover:bg-nba-gold">
              {saved === "saving" ? "Saving…" : "Save result"}
            </button>
          </div>
        )}
      </div>

      <button onClick={onReset} className="btn-ghost mt-4 w-full">Draft again ↺</button>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = ["#f97316", "#fbbf24", "#22c55e", "#ffffff"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 1 }}
          animate={{ y: "110vh", rotate: Math.random() * 720 }}
          transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.6 }}
          className="absolute h-2 w-2 rounded-sm"
          style={{ background: colors[i % colors.length] }}
        />
      ))}
    </div>
  );
}
