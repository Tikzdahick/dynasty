// Roster "identity" generator — gives every finished team a unique, flavorful
// archetype name + tagline derived from its stat profile. Pure & deterministic
// for a given roster so the same team always reads the same way.
import { NbaPlayer, SoccerPlayer } from "@/types";
import { ChemLabel } from "@/lib/chemistry";

export interface Identity {
  name: string;
  tagline: string;
  emoji: string;
}

function avg<T>(arr: T[], pick: (t: T) => number, fallback = 0): number {
  return arr.length ? arr.reduce((a, t) => a + pick(t), 0) / arr.length : fallback;
}

/** NBA: lean on scoring / rebounding / playmaking tilt + overall + chemistry. */
export function nbaIdentity(roster: NbaPlayer[], chem: ChemLabel | undefined): Identity {
  if (roster.length === 0)
    return { name: "Empty Roster", tagline: "Nobody on the floor.", emoji: "🏀" };

  const ppg = avg(roster, (p) => p.ppg);
  const rpg = avg(roster, (p) => p.rpg);
  const apg = avg(roster, (p) => p.apg);
  const ovr = avg(roster, (p) => p.overall);

  // normalise the three pillars so we can find the dominant tilt
  const score = ppg / 25;
  const board = rpg / 9;
  const dish = apg / 6;
  const spread = Math.max(score, board, dish) - Math.min(score, board, dish);
  const balanced = spread < 0.18;

  let name: string;
  let tagline: string;
  let emoji: string;

  if (balanced && ovr >= 90) {
    name = "The Monolith";
    tagline = "No weakness, no mercy — great everywhere.";
    emoji = "🗿";
  } else if (balanced) {
    name = "The All-Rounders";
    tagline = "Balanced to a fault. Whatever you need.";
    emoji = "⚖️";
  } else if (score >= board && score >= dish) {
    name = ovr >= 92 ? "The Scoring Pantheon" : "Run & Gun";
    tagline = "Outscore everyone. Defense optional.";
    emoji = "🎯";
  } else if (board >= dish) {
    name = "Bully Ball";
    tagline = "Win the glass, win the war.";
    emoji = "💪";
  } else {
    name = "Pass-First Maestros";
    tagline = "The ball never stops moving.";
    emoji = "🎩";
  }

  // chemistry can override with a flavor prefix for elite cohesion
  if (chem === "Elite") {
    name = `${name} Dynasty`;
    tagline = `${tagline} Built to last.`;
  } else if (chem === "Poor" && ovr >= 88) {
    name = "Superteam of Strangers";
    tagline = "All the talent, none of the chemistry.";
    emoji = "🧩";
  }

  return { name, tagline, emoji };
}

/** Soccer: tilt by attack / midfield / defense from the XI's stat profile. */
export function soccerIdentity(
  xi: SoccerPlayer[],
  formation: string,
  chem: ChemLabel | undefined
): Identity {
  if (xi.length === 0)
    return { name: "No XI", tagline: "Empty team sheet.", emoji: "⚽" };

  const fwd = xi.filter((p) => p.position === "FWD");
  const mid = xi.filter((p) => p.position === "MID");
  const def = xi.filter((p) => p.position === "DEF");

  const attack = avg(fwd, (p) => p.shooting, 70) * 0.7 + avg(fwd, (p) => p.pace, 70) * 0.3;
  const midfield = avg(mid, (p) => p.passing, 70);
  const defense = avg(def, (p) => p.defending, 70);
  const ovr = avg(xi, (p) => p.overall);

  const max = Math.max(attack, midfield, defense);

  let name: string;
  let tagline: string;
  let emoji: string;

  if (defense === max) {
    name = "Catenaccio";
    tagline = "Lock the door and throw away the key.";
    emoji = "🔒";
  } else if (midfield === max) {
    name = "Tiki-Taka";
    tagline = "Death by a thousand passes.";
    emoji = "🎼";
  } else {
    name = ovr >= 90 ? "Total Football" : "Goal Machine";
    tagline = "Relentless, fearless, forward.";
    emoji = "⚡";
  }

  if (chem === "Elite") {
    name = `${name} XI`;
    tagline = `${tagline} A team that breathes together.`;
  }

  return { name, tagline, emoji };
}
