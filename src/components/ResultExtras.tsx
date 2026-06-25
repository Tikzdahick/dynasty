"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Identity } from "@/lib/identity";
import { Award } from "@/lib/awards";
import { achievementById } from "@/lib/achievements";

interface Props {
  accent: "nba" | "soccer";
  identity: Identity;
  awards: Award[];
  shareText: string;
  newAchievements: string[];
  streak: number;
}

export function ResultExtras({
  accent,
  identity,
  awards,
  shareText,
  newAchievements,
  streak,
}: Props) {
  const accentText = accent === "nba" ? "text-nba" : "text-soccer";
  const accentBg = accent === "nba" ? "bg-nba" : "bg-soccer";
  const accentGold = accent === "nba" ? "text-nba-gold" : "text-soccer-gold";
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
        return;
      }
    } catch {
      /* user dismissed share sheet — fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Roster identity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden p-5 text-center"
      >
        <div className="text-3xl">{identity.emoji}</div>
        <div className={`mt-1 text-xs uppercase tracking-[0.3em] text-white/40`}>
          Team Identity
        </div>
        <div className={`text-2xl font-black ${accentText}`}>{identity.name}</div>
        <p className="mt-1 text-sm italic text-white/55">{identity.tagline}</p>
      </motion.div>

      {/* Awards / recap */}
      {awards.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-left">
          {awards.map((a) => (
            <div key={a.label} className="card p-3">
              <div className="text-xl">{a.emoji}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-white/40">
                {a.label}
              </div>
              <div className="truncate text-sm font-bold" title={a.value}>
                {a.value}
              </div>
              {a.detail && (
                <div className="truncate text-[11px] text-white/45">{a.detail}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Newly unlocked achievements */}
      {newAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card border-amber-300/30 p-4"
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
            🎖 Achievement{newAchievements.length > 1 ? "s" : ""} unlocked
          </div>
          <div className="space-y-2">
            {newAchievements.map((id) => {
              const a = achievementById(id);
              if (!a) return null;
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-2xl">{a.emoji}</span>
                  <div>
                    <div className="text-sm font-bold">{a.label}</div>
                    <div className="text-xs text-white/45">{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Share */}
      <div className="card p-4">
        {streak > 1 && (
          <p className="mb-2 text-sm font-semibold">
            <span className={accentGold}>🔥 {streak}-day streak</span>{" "}
            <span className="text-white/40">— keep it alive tomorrow.</span>
          </p>
        )}
        <button
          onClick={share}
          className={`btn w-full ${accentBg} text-black hover:opacity-90`}
        >
          {copied ? "Copied to clipboard ✓" : "📋 Share result"}
        </button>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-center text-xs leading-relaxed text-white/55">
          {shareText}
        </pre>
      </div>
    </div>
  );
}
