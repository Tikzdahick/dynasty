// Shared draft-cost curve used by every player pool so the salary cap /
// budget stays meaningful no matter where a player is sourced from.
export function ratingCost(overall: number): number {
  return Math.round(Math.pow((Math.max(overall, 70) - 70) / 29, 1.7) * 110 + 25);
}

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
