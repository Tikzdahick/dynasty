import Link from "next/link";
import { cookies } from "next/headers";
import { PACKS as NBA_PACKS } from "@/lib/myteam/packs";
import { PACKS as SOCCER_PACKS } from "@/lib/soccer-myteam/packs";
import {
  PACK_ODDS_COOKIE,
  RARITIES,
  Sport,
  effectiveWeights,
  isOverridden,
  parsePackOdds,
} from "@/lib/admin/packOdds";
import { PackOddsEditor, EditorPack } from "@/components/admin/PackOddsEditor";

export const dynamic = "force-dynamic";

export default function AdminOdds() {
  const overrides = parsePackOdds(cookies().get(PACK_ODDS_COOKIE)?.value);

  const build = (sport: Sport, packs: typeof NBA_PACKS): EditorPack[] =>
    packs.map((p) => ({
      sport,
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      price: p.price,
      guarantee: p.guarantee,
      overridden: isOverridden(sport, p.id, overrides),
      weights: effectiveWeights(sport, p.id, p.weights, overrides),
    }));

  const editorPacks = [...build("nba", NBA_PACKS), ...build("soccer", SOCCER_PACKS)];

  return (
    <div className="py-2">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin" className="text-sm text-white/40 hover:text-white">
            ← Admin
          </Link>
          <h1 className="mt-1 text-3xl font-black">🎴 Pack Odds</h1>
          <p className="max-w-2xl text-sm text-white/50">
            Adjust pull-rate weights per rarity, per pack. Percentages are shown live before you save.
            Saving overrides the odds <span className="font-semibold text-white/70">for this browser</span>{" "}
            (the pack draws use them immediately); the global defaults live in code
            (<code className="text-white/60">lib/myteam/packs.ts</code>).
          </p>
        </div>
        <form method="post" action="/api/admin/odds">
          <input type="hidden" name="action" value="reset" />
          <button
            type="submit"
            className="rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Reset to defaults
          </button>
        </form>
      </div>

      <PackOddsEditor packs={editorPacks} rarities={[...RARITIES]} />
    </div>
  );
}
