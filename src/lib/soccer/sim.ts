import {
  SoccerPlayer,
  SoccerMatchResult,
  SoccerTournamentResult,
  MatchScorer,
} from "@/types";

function gauss(mean = 0, sd = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function poisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

interface TeamStrength {
  attack: number;
  midfield: number;
  defense: number;
  overall: number;
}

export function teamStrength(starters: SoccerPlayer[]): TeamStrength {
  const fwd = starters.filter((p) => p.position === "FWD");
  const mid = starters.filter((p) => p.position === "MID");
  const def = starters.filter((p) => p.position === "DEF");
  const gk = starters.filter((p) => p.position === "GK");

  const avg = (arr: SoccerPlayer[], key: keyof SoccerPlayer, fallback: number) =>
    arr.length ? arr.reduce((a, p) => a + (p[key] as number), 0) / arr.length : fallback;

  const attack =
    avg(fwd, "shooting", 70) * 0.6 + avg(mid, "passing", 70) * 0.25 + avg(fwd, "pace", 70) * 0.15;
  const midfield = avg(mid, "passing", 70) * 0.7 + avg(mid, "defending", 60) * 0.3;
  const defense = avg(def, "defending", 70) * 0.6 + avg(gk, "defending", 70) * 0.4;
  const overall = starters.length
    ? starters.reduce((a, p) => a + p.overall, 0) / starters.length
    : 0;

  return {
    attack: Math.round(attack * 10) / 10,
    midfield: Math.round(midfield * 10) / 10,
    defense: Math.round(defense * 10) / 10,
    overall: Math.round(overall * 10) / 10,
  };
}

const NATIONS = [
  "Brazil", "France", "Argentina", "Germany", "Spain", "Italy", "Netherlands",
  "Portugal", "England", "Belgium", "Croatia", "Uruguay", "Colombia", "Mexico",
  "Japan", "Senegal", "Morocco", "USA", "Denmark", "Switzerland", "Poland", "Serbia",
];

function pickScorers(
  starters: SoccerPlayer[],
  goals: number
): MatchScorer[] {
  if (goals === 0) return [];
  // weight by position and shooting
  const weighted = starters.map((p) => {
    const posW = p.position === "FWD" ? 6 : p.position === "MID" ? 3 : p.position === "DEF" ? 1 : 0.05;
    return { p, w: posW * (p.shooting / 60) };
  });
  const total = weighted.reduce((a, x) => a + x.w, 0);
  const scorers: MatchScorer[] = [];
  for (let g = 0; g < goals; g++) {
    let r = Math.random() * total;
    let chosen = weighted[0].p;
    for (const x of weighted) {
      r -= x.w;
      if (r <= 0) {
        chosen = x.p;
        break;
      }
    }
    scorers.push({ name: chosen.name, minute: 1 + Math.floor(Math.random() * 90) });
  }
  return scorers.sort((a, b) => a.minute - b.minute);
}

function playMatch(
  round: string,
  team: TeamStrength,
  starters: SoccerPlayer[],
  oppStrength: number,
  knockout: boolean
): SoccerMatchResult {
  const opponent = NATIONS[Math.floor(Math.random() * NATIONS.length)];

  // expected goals from attack vs opp defense + midfield tilt
  const midEdge = (team.midfield - oppStrength) * 0.012;
  const teamXg = Math.max(
    0.25,
    1.25 + (team.attack - oppStrength) * 0.06 + midEdge + gauss(0, 0.25)
  );
  const oppXg = Math.max(
    0.2,
    1.2 + (oppStrength - team.defense) * 0.06 - midEdge + gauss(0, 0.25)
  );

  let teamGoals = poisson(teamXg);
  let oppGoals = poisson(oppXg);

  let draw = teamGoals === oppGoals;
  let win = teamGoals > oppGoals;
  let penalties: { team: number; opp: number } | undefined;

  if (knockout && draw) {
    // penalty shootout — slight edge to higher overall
    const edge = (team.overall - oppStrength) * 0.01;
    let tp = 0;
    let op = 0;
    for (let i = 0; i < 5; i++) {
      if (Math.random() < 0.75 + edge) tp++;
      if (Math.random() < 0.75 - edge) op++;
    }
    while (tp === op) {
      if (Math.random() < 0.75 + edge) tp++;
      if (Math.random() < 0.75 - edge) op++;
    }
    penalties = { team: tp, opp: op };
    win = tp > op;
    draw = false;
  }

  return {
    round,
    opponent,
    teamGoals,
    oppGoals,
    scorers: pickScorers(starters, teamGoals),
    oppScorers: Array.from({ length: oppGoals }, (_, i) => ({
      name: opponent,
      minute: 1 + Math.floor(Math.random() * 90),
    })).sort((a, b) => a.minute - b.minute),
    win,
    draw,
    penalties,
  };
}

const KNOCKOUT_ROUNDS = ["Round of 16", "Quarter-Final", "Semi-Final", "Final"];

export function simulateTournament(starters: SoccerPlayer[]): SoccerTournamentResult {
  const team = teamStrength(starters);
  const matches: SoccerMatchResult[] = [];

  // Group stage — 3 games, always played (you qualify on results but progression continues)
  for (let i = 0; i < 3; i++) {
    const oppStrength = 74 + gauss(2, 5);
    matches.push(playMatch(`Group Game ${i + 1}`, team, starters, oppStrength, false));
  }

  // Knockout — opponents get progressively stronger
  let champion = false;
  let reachedRound = "Group Stage";
  for (let r = 0; r < KNOCKOUT_ROUNDS.length; r++) {
    const oppStrength = 78 + r * 2.5 + gauss(2, 4);
    const m = playMatch(KNOCKOUT_ROUNDS[r], team, starters, oppStrength, true);
    matches.push(m);
    reachedRound = KNOCKOUT_ROUNDS[r];
    if (!m.win) break;
    if (r === KNOCKOUT_ROUNDS.length - 1) champion = true;
  }

  return {
    matches,
    champion,
    reachedRound: champion ? "Champion" : reachedRound,
    teamRating: team.overall,
  };
}
