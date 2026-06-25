import { Decade, DECADES } from "@/types";

// A minimal shape the validator can check for either sport.
interface ValidatablePlayer {
  id: string;
  name: string;
  position: string;
  overall: number;
}

interface ValidatableTeam<P extends ValidatablePlayer> {
  decade: Decade;
  team: string;
  label: string;
  players: P[];
}

export interface ValidatableDeck<P extends ValidatablePlayer> {
  label: string; // "NBA" | "Soccer"
  iconic: ValidatableTeam<P>[];
  validPositions: readonly string[];
  eligible: (p: P) => string[];
  // The real candidate function — used to assert the strict player–team rule.
  candidates: (
    decade: Decade,
    team: string,
    exclude: Set<string>,
    openPositions: Set<string> | null
  ) => P[];
}

/**
 * Encodes the strict player–team data rules as hard invariants:
 *  - every roster is a real, unique decade+team combo with a label
 *  - players have valid positions, sane ratings, and can fill at least one slot
 *  - the same id always maps to the same player name across rosters
 *  - CRITICAL: a spin for a team/decade may ONLY surface that exact roster —
 *    never a borrowed or pool-padded player from elsewhere.
 * Returns a list of human-readable problems (empty == clean).
 */
export function validateDeck<P extends ValidatablePlayer>(d: ValidatableDeck<P>): string[] {
  const errors: string[] = [];
  const combos = new Set<string>();
  const nameById = new Map<string, string>();

  for (const t of d.iconic) {
    const at = `[${d.label}] ${t.decade} ${t.team}`;

    if (!DECADES.includes(t.decade)) errors.push(`${at}: invalid decade "${t.decade}"`);
    if (!t.team) errors.push(`${at}: empty team name`);
    if (!t.label) errors.push(`${at}: missing label`);

    const combo = `${t.decade}::${t.team}`;
    if (combos.has(combo)) errors.push(`${at}: duplicate decade+team roster`);
    combos.add(combo);

    if (t.players.length < 2)
      errors.push(`${at}: roster has ${t.players.length} player(s); need at least 2`);

    const here = new Set<string>();
    for (const p of t.players) {
      const at2 = `${at} → ${p.name}`;
      if (here.has(p.id)) errors.push(`${at2}: listed twice on this roster`);
      here.add(p.id);

      if (!d.validPositions.includes(p.position))
        errors.push(`${at2}: invalid position "${p.position}"`);
      if (!(p.overall >= 1 && p.overall <= 100))
        errors.push(`${at2}: overall ${p.overall} out of range 1–100`);
      if (d.eligible(p).length === 0)
        errors.push(`${at2}: eligible for no position — cannot be drafted`);

      const seenName = nameById.get(p.id);
      if (seenName && seenName !== p.name)
        errors.push(`${at2}: id "${p.id}" already used by "${seenName}"`);
      else nameById.set(p.id, p.name);
    }

    // Strict player–team rule: the engine must only ever surface this exact
    // roster for this team/decade. If anything else shows up, it's a leak.
    const rosterIds = new Set(t.players.map((p) => p.id));
    for (const c of d.candidates(t.decade, t.team, new Set<string>(), null)) {
      if (!rosterIds.has(c.id))
        errors.push(`${at}: spin surfaced "${c.name}", who is NOT on this roster (borrow/pad leak)`);
    }
  }

  return errors;
}

/**
 * Throws (failing `next build` / SSR) if any deck violates the rules.
 * On the client it logs instead, so valid-at-build data never crashes the UI.
 */
export function reportDataErrors(errors: string[]): void {
  if (errors.length === 0) return;
  const msg =
    `Dynasty data integrity check failed — ${errors.length} problem(s):\n` +
    errors.map((e) => "  • " + e).join("\n");
  if (typeof window === "undefined") throw new Error(msg);
  console.error(msg);
}
