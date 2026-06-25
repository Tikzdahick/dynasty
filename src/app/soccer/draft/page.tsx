"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RoundDraft, DraftMode } from "@/components/RoundDraft";
import { SlotDef } from "@/components/Court";
import { soccerDeck } from "@/lib/draft/candidates";
import { FORMATIONS } from "@/lib/soccer/formations";
import { simulateTournament } from "@/lib/soccer/sim";
import {
  FormationName,
  SoccerPlayer,
  SoccerTournamentResult,
} from "@/types";
import { useAuth } from "@/lib/auth";
import { saveSoccerResult } from "@/lib/store/leaderboard";
import { computeChemistry, Chemistry } from "@/lib/chemistry";
import { PreSimSummary } from "@/components/PreSimSummary";
import { soccerIdentity } from "@/lib/identity";
import { soccerAwards } from "@/lib/awards";
import { soccerShareText } from "@/lib/share";
import { ResultExtras } from "@/components/ResultExtras";
import { evaluateSoccer } from "@/lib/achievements";
import { recordDailyPlay, currentStreak, unlock } from "@/lib/store/stats";
import { getLocalNba, getLocalSoccer } from "@/lib/store/local";

function soccerSlots(formationName: FormationName): SlotDef[] {
  const slots = FORMATIONS[formationName].slots.map((s, i) => ({
    id: `s${i}`,
    position: s.position,
    label: s.position,
    x: s.x,
    y: s.y,
  }));
  const subs = [0, 1, 2].map((i) => ({
    id: `sub${i}`,
    position: "ANY",
    label: "Sub",
    bench: true,
  }));
  return [...slots, ...subs];
}

type Phase = "formation" | "draft" | "summary" | "sim" | "done";
type GhostSoccer = SoccerPlayer & { ghost?: boolean };

// Decoy ("ghost") players flash inflated stats during the draft but
// perform significantly worse in the simulated tournament.
function weakenGhost(p: SoccerPlayer): SoccerPlayer {
  const g = p as GhostSoccer;
  if (!g.ghost) return p;
  return {
    ...g,
    overall: Math.round(g.overall * 0.78),
    pace: Math.round(g.pace * 0.82),
    shooting: Math.round(g.shooting * 0.82),
    passing: Math.round(g.passing * 0.82),
    defending: Math.round(g.defending * 0.82),
  };
}

export default function SoccerDraftPage() {
  const router = useRouter();
  const [mode, setMode] = useState<DraftMode | null>(null);
  const [timed, setTimed] = useState(false);
  const [phase, setPhase] = useState<Phase>("formation");
  const [formationName, setFormationName] = useState<FormationName>("4-3-3");
  const [placed, setPlaced] = useState<(SoccerPlayer | null)[]>([]);
  const [xi, setXi] = useState<SoccerPlayer[]>([]);
  const [chemistry, setChemistry] = useState<Chemistry | null>(null);
  const [result, setResult] = useState<SoccerTournamentResult | null>(null);

  useEffect(() => {
    setMode((sessionStorage.getItem("dynasty.soccer.mode") as DraftMode) || "classic");
    setTimed(sessionStorage.getItem("dynasty.soccer.timer") === "1");
  }, []);

  const onConfirm = (next: (SoccerPlayer | null)[]) => {
    const eleven = next.slice(0, 11).filter(Boolean) as SoccerPlayer[];
    const all = next.filter(Boolean) as SoccerPlayer[];
    setPlaced(next);
    setXi(eleven);
    setChemistry(computeChemistry("soccer", all));
    setPhase("summary");
  };

  const simulate = () => {
    setResult(simulateTournament(xi.map(weakenGhost), chemistry?.pct ?? 0));
    setPhase("sim");
  };

  const teamRating = xi.length
    ? Math.round((xi.map(weakenGhost).reduce((a, p) => a + p.overall, 0) / xi.length) * 10) / 10
    : 0;

  if (!mode) return null;

  return (
    <div className="bg-grain">
      <AnimatePresence mode="wait">
        {phase === "formation" && (
          <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-2xl">
            <Link href="/soccer" className="text-sm text-white/40 hover:text-white">← Modes</Link>
            <h1 className="mt-1 text-2xl font-black">Pick a formation</h1>
            <p className="mb-4 text-sm text-white/50">{labelFor(mode)}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.keys(FORMATIONS) as FormationName[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormationName(f)}
                  className={`rounded-xl border p-4 text-center font-bold transition ${
                    formationName === f ? "border-soccer bg-soccer/10 text-soccer" : "border-white/10 bg-panel text-white/70 hover:border-soccer/40"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => setPhase("draft")} className="btn mt-5 w-full bg-soccer text-black hover:bg-soccer-gold">
              Start drafting →
            </button>
          </motion.div>
        )}

        {phase === "draft" && (
          <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RoundDraft<SoccerPlayer>
              variant="soccer"
              accent="soccer"
              slots={soccerSlots(formationName)}
              starterCount={11}
              benchCount={3}
              deck={soccerDeck}
              mode={mode}
              timed={timed}
              contextLabel={`Soccer · ${formationName} · ${labelFor(mode)}${timed ? " · ⏱ Timed" : ""}`}
              confirmLabel="Confirm XI →"
              onConfirm={onConfirm}
              onExit={() => router.push("/soccer")}
            />
          </motion.div>
        )}

        {phase === "summary" && chemistry && (
          <motion.div key="sum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PreSimSummary<SoccerPlayer>
              variant="soccer"
              accent="soccer"
              slots={soccerSlots(formationName)}
              placed={placed}
              chemistry={chemistry}
              rating={teamRating}
              subtitle={`${formationName} · ${labelFor(mode)}`}
              onSimulate={simulate}
              onBack={() => setPhase("draft")}
            />
          </motion.div>
        )}

        {phase === "sim" && result && (
          <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TournamentSim result={result} onDone={() => setPhase("done")} />
          </motion.div>
        )}

        {phase === "done" && result && (
          <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TournamentResult result={result} xi={xi} formationName={formationName} chemistry={chemistry} mode={mode ?? "classic"} onReset={() => router.push("/soccer")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function labelFor(m: DraftMode): string {
  return m === "classic" ? "Classic" : m === "iq" ? "Soccer IQ" : m === "daily" ? "Daily Challenge" : "Team Draft";
}

/* ----------------------------- SIM ----------------------------- */
function TournamentSim({ result, onDone }: { result: SoccerTournamentResult; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= result.matches.length) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [shown, result.matches.length, onDone]);

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-center text-sm uppercase tracking-[0.3em] text-white/40">Tournament</p>
      <div className="mt-4 space-y-2">
        {result.matches.slice(0, shown).map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`card p-4 ${m.upset ? "border-red-500/60 ring-1 ring-red-500/30" : m.win ? "border-soccer/40" : "border-red-500/40"}`}>
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>{m.round}{m.upset && <span className="ml-1 text-red-400">· UPSET</span>}</span>
              <span className={`font-bold ${m.win ? "text-soccer" : m.draw ? "text-white/60" : "text-red-400"}`}>{m.win ? "WIN" : m.draw ? "DRAW" : "OUT"}</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-2xl font-black tabular-nums">
              <span className="text-soccer">{m.teamGoals}</span>
              <span className="text-white/30">–</span>
              <span className="text-white/70">{m.oppGoals}</span>
            </div>
            <div className="mt-1 text-center text-sm text-white/50">
              Dynasty XI vs {m.opponent}
              {m.penalties && <span className="ml-1 text-soccer-gold">({m.penalties.team}-{m.penalties.opp} pens)</span>}
            </div>
            {m.scorers.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-white/50">
                {m.scorers.map((s, j) => (
                  <span key={j}>⚽ {s.name} {s.minute}&apos;</span>
                ))}
              </div>
            )}
            {m.story && (
              <div className="mt-2 text-center text-[11px] italic text-red-300/80">{m.story}</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- RESULT ----------------------------- */
function TournamentResult({
  result,
  xi,
  formationName,
  chemistry,
  mode,
  onReset,
}: {
  result: SoccerTournamentResult;
  xi: SoccerPlayer[];
  formationName: FormationName;
  chemistry: Chemistry | null;
  mode: DraftMode;
  onReset: () => void;
}) {
  const { user, displayName, guestName, setGuestName } = useAuth();
  const [name, setName] = useState(displayName !== "Guest" ? displayName : guestName);
  const [saved, setSaved] = useState<"idle" | "saving" | "cloud" | "local">("idle");
  const upset = result.matches.find((m) => m.upset);

  const daily = mode === "daily";
  const identity = useMemo(
    () => soccerIdentity(xi, formationName, chemistry?.label),
    [xi, formationName, chemistry]
  );
  const awards = useMemo(() => soccerAwards(result, xi), [result, xi]);
  const [streak, setStreak] = useState(0);
  const [newAch, setNewAch] = useState<string[]>([]);
  const shareText = useMemo(
    () =>
      soccerShareText({
        result,
        formation: formationName,
        identity,
        mode: labelFor(mode),
        daily,
        streak,
      }),
    [result, formationName, identity, mode, daily, streak]
  );

  // record streak (daily only) + evaluate achievements once when the result mounts
  useEffect(() => {
    const s = daily ? recordDailyPlay().count : currentStreak();
    setStreak(s);
    const hadGhost = xi.some((p) => (p as GhostSoccer).ghost);
    const savedCount = getLocalNba().length + getLocalSoccer().length;
    const ids = evaluateSoccer({
      result,
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
    const res = await saveSoccerResult({
      username: name.trim(),
      result: result.reachedRound,
      players: xi.map((p) => p.name),
      formation: formationName,
      rating: result.teamRating,
      chemistry: chemistry?.label,
    });
    setSaved(res.saved);
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      {result.champion && <Confetti />}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
        <div className="text-7xl">{result.champion ? "🏆" : "⚽"}</div>
        <h2 className="mt-3 text-3xl font-black">
          {result.champion ? <span className="text-soccer-gold">WORLD CHAMPIONS</span> : `Eliminated: ${result.reachedRound}`}
        </h2>
        <p className="mt-1 text-sm text-white/40">{formationName} · Team rating {result.teamRating}</p>
        {chemistry && (
          <p className="mt-1 text-sm">
            Chemistry:{" "}
            <span className={chemistry.label === "Elite" ? "text-amber-300" : chemistry.label === "Good" ? "text-emerald-300" : "text-white/50"}>
              {chemistry.label}
            </span>
          </p>
        )}
        {!result.champion && upset && (
          <p className="mt-2 text-sm italic text-red-300/80">😱 {upset.story}</p>
        )}
      </motion.div>

      <div className="card mt-6 p-4 text-left">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Your XI</div>
        <div className="flex flex-wrap gap-1.5">
          {xi.map((p) => {
            const ghost = (p as GhostSoccer).ghost;
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
        {xi.some((p) => (p as GhostSoccer).ghost) && (
          <p className="mt-2 text-[11px] italic text-red-300/70">
            🫥 Ghost busted — a decoy you drafted played well below its flashy card.
          </p>
        )}
      </div>

      <div className="mt-6">
        <ResultExtras
          accent="soccer"
          identity={identity}
          awards={awards}
          shareText={shareText}
          newAchievements={newAch}
          streak={streak}
        />
      </div>

      <div className="card mt-6 p-4">
        {saved === "cloud" || saved === "local" ? (
          <div className="text-sm">
            <p className="font-semibold text-soccer">Saved to leaderboard ✓</p>
            <p className="mt-1 text-white/40">
              {saved === "local" ? "Stored on this device. Sign in to save to the global board." : "Posted to the global leaderboard."}
            </p>
            <Link href="/leaderboard" className="btn-ghost mt-3 w-full">View leaderboard →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="flex-1 rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-sm outline-none focus:border-soccer/60" />
            <button onClick={save} disabled={!name.trim() || saved === "saving"} className="btn bg-soccer text-black hover:bg-soccer-gold">
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
  const colors = ["#22c55e", "#fbbf24", "#ffffff", "#16a34a"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div key={i} initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 1 }} animate={{ y: "110vh", rotate: Math.random() * 720 }} transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.6 }} className="absolute h-2 w-2 rounded-sm" style={{ background: colors[i % colors.length] }} />
      ))}
    </div>
  );
}
