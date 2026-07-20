// One-time (re-runnable) vendoring step: download every player's resolved
// primary headshot into public/headshots/<sport>/<slug>.<ext> and regenerate the
// LOCAL_*_HEADSHOTS maps, so the app serves images from its own origin instead of
// hotlinking nba.com / ESPN / Wikipedia (which can break, rate-limit, or move).
//
//   node scripts/download-headshots.mjs           # both sports
//   node scripts/download-headshots.mjs soccer    # one sport
//
// Resolution mirrors the runtime resolvers' primary source (manual override ->
// nba.com/ESPN id -> Wikipedia). Re-run after adding players or changing an
// override so the vendored copy stays in sync.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const p = (rel) => join(root, rel);

const slugId = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Parse `name: "..."` (+ optional numeric id) entries, one player per line.
function parseRoster(file, idField) {
  const out = [];
  for (const line of readFileSync(p(file), "utf8").split("\n")) {
    const nm = line.match(/name:\s*"([^"]+)"/);
    if (!nm) continue;
    const idm = line.match(new RegExp(idField + ":\\s*(\\d+)"));
    out.push({ name: nm[1], id: idm ? Number(idm[1]) : undefined });
  }
  return out;
}

// Parse a `"slug": "url"` map module (skipping comment lines).
function parseMap(file) {
  const src = readFileSync(p(file), "utf8")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
  const map = {};
  const re = /"([a-z0-9-]+)":\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) map[m[1]] = m[2];
  return map;
}

const CFG = {
  nba: {
    rosters: [["src/lib/nba/players.ts", "nbaPlayerId"], ["src/lib/nba/teams.ts", "nbaPlayerId"]],
    wiki: "src/lib/nba/wikipediaImages.ts",
    manual: "src/lib/nba/manualHeadshots.ts",
    idUrl: (id) => `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`,
    outMap: "src/lib/nba/localHeadshots.ts",
    exportName: "LOCAL_NBA_HEADSHOTS",
  },
  soccer: {
    rosters: [["src/lib/soccer/players.ts", "espnPlayerId"], ["src/lib/soccer/teams.ts", "espnPlayerId"]],
    wiki: "src/lib/soccer/wikipediaImages.ts",
    manual: "src/lib/soccer/manualHeadshots.ts",
    idUrl: (id) => `https://a.espncdn.com/i/headshots/soccer/players/full/${id}.png`,
    outMap: "src/lib/soccer/localHeadshots.ts",
    exportName: "LOCAL_SOCCER_HEADSHOTS",
  },
};

function primaryUrl(cfg, slug, idBySlug, wiki, manual) {
  if (manual[slug]) {
    const proxied = manual[slug].match(/^\/api\/nba-headshot\/(\d+)$/);
    return proxied ? cfg.idUrl(proxied[1]) : manual[slug];
  }
  if (idBySlug[slug] != null) return cfg.idUrl(idBySlug[slug]);
  if (wiki[slug]) return wiki[slug];
  return null;
}

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

async function fetchImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "DynastyGame/1.0 (headshot vendoring)" },
  });
  if (!res.ok) return null;
  const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
  const ext = EXT[ct] || (url.split("?")[0].match(/\.(png|jpe?g|webp|gif)$/i)?.[1]?.toLowerCase()) || "png";
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, ext: ext === "jpeg" ? "jpg" : ext };
}

// simple concurrency-limited map
async function pool(items, limit, fn) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function runSport(label, cfg) {
  const idBySlug = {};
  const bySlug = new Map(); // slug -> name
  for (const [file, idField] of cfg.rosters) {
    for (const { name, id } of parseRoster(file, idField)) {
      const slug = slugId(name);
      if (!bySlug.has(slug)) bySlug.set(slug, name);
      if (id != null && idBySlug[slug] == null) idBySlug[slug] = id;
    }
  }
  const wiki = parseMap(cfg.wiki);
  const manual = parseMap(cfg.manual);

  const players = [...bySlug.keys()]
    .map((slug) => ({ slug, url: primaryUrl(cfg, slug, idBySlug, wiki, manual) }))
    .filter((x) => x.url);

  const outDir = p(`public/headshots/${label}`);
  mkdirSync(outDir, { recursive: true });
  console.log(`\n[${label}] downloading ${players.length} images...`);

  const map = {};
  let ok = 0, fail = 0;
  await pool(players, 6, async ({ slug, url }) => {
    try {
      const img = await fetchImage(url);
      if (!img) { fail++; return; }
      const file = `${slug}.${img.ext}`;
      writeFileSync(join(outDir, file), img.buf);
      map[slug] = `/headshots/${label}/${file}`;
      ok++;
    } catch {
      fail++;
    }
  });

  const entries = Object.keys(map).sort().map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map[k])},`).join("\n");
  const out = `// AUTO-GENERATED by scripts/download-headshots.mjs — do not edit by hand.
// Maps player id (slug) -> vendored image path under /public.
// Regenerate with: node scripts/download-headshots.mjs
export const ${cfg.exportName}: Record<string, string> = {
${entries}
};
`;
  writeFileSync(p(cfg.outMap), out);
  console.log(`[${label}] ✅ vendored ${ok}, ❌ failed ${fail}. Wrote ${cfg.outMap}`);
}

async function main() {
  const only = process.argv[2];
  for (const label of only ? [only] : Object.keys(CFG)) {
    if (!CFG[label]) { console.error(`Unknown sport "${label}"`); process.exit(1); }
    await runSport(label, CFG[label]);
  }
}
main();
