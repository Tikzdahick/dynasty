"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DECADES, NbaPlayer, SoccerPlayer, SpinResult } from "@/types";
import { spinNba, spinSoccer, NBA_REEL_TEAMS, SOCCER_REEL_TEAMS } from "@/lib/draft/spin";

type Sport = "nba" | "soccer";
type AnyResult = SpinResult<NbaPlayer> | SpinResult<SoccerPlayer>;

type Phase = "idle" | "spinning" | "decadeLocked" | "revealed";

export function SpinMachine({
  sport,
  onComplete,
}: {
  sport: Sport;
  onComplete: (result: AnyResult) => void;
}) {
  const teams = sport === "nba" ? NBA_REEL_TEAMS : SOCCER_REEL_TEAMS;
  const accent = sport === "nba" ? "nba" : "soccer";

  const [phase, setPhase] = useState<Phase>("idle");
  const [decade, setDecade] = useState<string>(DECADES[0]);
  const [team, setTeam] = useState<string>(teams[0]);
  const [result, setResult] = useState<AnyResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const spin = () => {
    if (phase === "spinning") return;
    const res = sport === "nba" ? spinNba() : spinSoccer();
    setResult(res);
    setPhase("spinning");

    // cycle reels
    const decadeInt = setInterval(
      () => setDecade(DECADES[Math.floor(Math.random() * DECADES.length)]),
      80
    );
    const teamInt = setInterval(
      () => setTeam(teams[Math.floor(Math.random() * teams.length)]),
      60
    );

    const stop = (id: ReturnType<typeof setInterval>) => clearInterval(id);

    // lock decade reel first
    timers.current.push(
      setTimeout(() => {
        stop(decadeInt);
        setDecade(res.decade);
        setPhase("decadeLocked");
      }, 1500)
    );
    // lock team reel
    timers.current.push(
      setTimeout(() => {
        stop(teamInt);
        setTeam(res.team);
      }, 2700)
    );
    // reveal locked player
    timers.current.push(
      setTimeout(() => setPhase("revealed"), 3200)
    );
  };

  const locked = result?.locked;

  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
        Decade · Team Spin
      </p>
      <h2 className="mt-1 text-2xl font-black">Spin your dynasty</h2>
      <p className="mt-1 text-sm text-white/50">
        Lock a legend, then draft their squad.
      </p>

      {/* Reels */}
      <div className="mt-7 grid grid-cols-2 gap-3">
        <Reel
          label="Decade"
          value={decade}
          locked={phase === "decadeLocked" || phase === "revealed"}
          spinning={phase === "spinning"}
          accent={accent}
        />
        <Reel
          label="Team"
          value={team}
          locked={phase === "revealed"}
          spinning={phase === "spinning" || phase === "decadeLocked"}
          accent={accent}
        />
      </div>

      {/* Reveal */}
      <AnimatePresence>
        {phase === "revealed" && locked && result && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <p className="mb-2 text-xs uppercase tracking-widest text-soccer-gold">
              {result.source === "iconic" ? result.label : `${result.label} (decade pool)`}
            </p>
            <LockedCard player={locked} accent={accent} />
            <p className="mt-3 text-sm text-white/60">
              <span className="font-bold text-white">{nameOf(locked)}</span> is
              auto-locked & free. Build the rest of your roster around them.
            </p>
            <button
              onClick={() => onComplete(result)}
              className={`btn mt-4 w-full ${
                accent === "nba" ? "bg-nba" : "bg-soccer"
              } text-black hover:opacity-90`}
            >
              Draft this squad →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "idle" && (
        <button
          onClick={spin}
          className={`btn mt-7 w-full ${
            accent === "nba" ? "bg-nba" : "bg-soccer"
          } text-black hover:opacity-90`}
        >
          🎰 Spin
        </button>
      )}
      {phase === "spinning" && (
        <div className="mt-7 text-sm font-semibold text-white/50">Spinning…</div>
      )}
      {phase === "decadeLocked" && (
        <div className="mt-7 text-sm font-semibold text-white/50">
          Decade locked — landing on a team…
        </div>
      )}
    </div>
  );
}

function Reel({
  label,
  value,
  locked,
  spinning,
  accent,
}: {
  label: string;
  value: string;
  locked: boolean;
  spinning: boolean;
  accent: string;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </div>
      <div
        className={`relative flex h-20 items-center justify-center overflow-hidden rounded-xl border-2 bg-panel px-2 transition ${
          locked
            ? accent === "nba"
              ? "border-nba shadow-[0_0_24px_-4px] shadow-nba/60"
              : "border-soccer shadow-[0_0_24px_-4px] shadow-soccer/60"
            : "border-white/10"
        }`}
      >
        <motion.span
          key={value}
          initial={spinning ? { y: -16, opacity: 0.3 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.08 }}
          className={`text-center text-lg font-black leading-tight ${
            locked ? (accent === "nba" ? "text-nba" : "text-soccer") : "text-white/80"
          }`}
        >
          {value}
        </motion.span>
        {/* gradient fades */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-panel to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-panel to-transparent" />
      </div>
    </div>
  );
}

function LockedCard({
  player,
  accent,
}: {
  player: NbaPlayer | SoccerPlayer;
  accent: string;
}) {
  const isNba = "ppg" in player;
  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="relative mx-auto w-56 overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/20 to-panel p-4 shadow-[0_0_40px_-6px] shadow-amber-400/60"
    >
      <div className="absolute right-2 top-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
        🔒 Locked
      </div>
      <div className="text-right">
        <div className="text-4xl font-black text-amber-300">{player.overall}</div>
        <div className="text-[10px] uppercase text-white/40">Overall</div>
      </div>
      <div className="mt-2 text-left">
        <div className="text-lg font-black leading-tight">{nameOf(player)}</div>
        <div className="text-xs text-white/50">
          {player.position} · {isNba ? player.era : (player as SoccerPlayer).country}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 text-[11px] text-white/80">
        {isNba ? (
          <>
            <Mini label="PPG" v={(player as NbaPlayer).ppg} />
            <Mini label="RPG" v={(player as NbaPlayer).rpg} />
            <Mini label="APG" v={(player as NbaPlayer).apg} />
          </>
        ) : (
          <>
            <Mini label="SHO" v={(player as SoccerPlayer).shooting} />
            <Mini label="PAS" v={(player as SoccerPlayer).passing} />
            <Mini label="PAC" v={(player as SoccerPlayer).pace} />
          </>
        )}
      </div>
    </motion.div>
  );
}

function Mini({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg bg-black/30 px-1 py-1 text-center">
      <div className="font-bold">{v}</div>
      <div className="text-[9px] text-white/40">{label}</div>
    </div>
  );
}

function nameOf(p: NbaPlayer | SoccerPlayer): string {
  return p.name;
}
