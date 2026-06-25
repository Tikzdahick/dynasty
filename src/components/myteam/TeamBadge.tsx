"use client";

import { TeamMeta } from "@/lib/myteam/teams";

interface Props {
  team: TeamMeta;
  size?: number;
  className?: string;
}

/** Stylised colour badge standing in for a team logo (no trademarked art). */
export function TeamBadge({ team, size = 64, className = "" }: Props) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-black tracking-tight text-white ring-2 ring-white/20 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        background: `radial-gradient(circle at 30% 25%, ${team.secondary}55, transparent 60%), linear-gradient(140deg, ${team.primary}, ${team.secondary})`,
        textShadow: "0 1px 3px rgba(0,0,0,0.6)",
      }}
    >
      {team.abbr}
    </div>
  );
}
