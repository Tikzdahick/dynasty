import Link from "next/link";
import { serviceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

interface Row {
  user_id: string;
  ip: string | null;
  fingerprint: string | null;
  flagged: boolean;
  created_at: string;
}

interface Cluster {
  value: string;
  count: number;
  latest: string;
}

// Group recent signups by a shared IP or fingerprint; a cluster of 2+ is a
// possible duplicate-account signal (rows come in newest-first).
function clusters(rows: Row[], key: "ip" | "fingerprint"): Cluster[] {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const v = r[key];
    if (!v) continue;
    const arr = m.get(v) ?? [];
    arr.push(r);
    m.set(v, arr);
  }
  return [...m.entries()]
    .filter(([, rs]) => rs.length >= 2)
    .map(([value, rs]) => ({ value, count: rs.length, latest: rs[0].created_at }))
    .sort((a, b) => b.count - a.count);
}

function when(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default async function AdminSignups() {
  let rows: Row[] = [];
  let error: string | null = null;
  try {
    const { data, error: e } = await serviceClient()
      .from("signup_events")
      .select("user_id,ip,fingerprint,flagged,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (e) error = e.message;
    else rows = (data ?? []) as Row[];
  } catch (err: any) {
    error = err?.message ?? "Could not load signup events.";
  }

  const ipClusters = clusters(rows, "ip");
  const fpClusters = clusters(rows, "fingerprint");
  const flaggedRows = rows.filter((r) => r.flagged);

  return (
    <div className="py-2">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-white/40 hover:text-white">
          ← Admin
        </Link>
        <h1 className="mt-1 text-3xl font-black">🕵️ Duplicate Signups</h1>
        <p className="max-w-2xl text-sm text-white/50">
          Accounts sharing an IP or browser fingerprint within a short window. This is a{" "}
          <span className="font-semibold text-white/70">signal for review only</span> — nothing is
          auto-banned, and shared networks (households, offices) legitimately collide.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Couldn’t load signup events: {error}. Make sure <code>phase5_signups.sql</code> has been run.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ClusterCard title="Shared IP" kind="IP" clusters={ipClusters} />
        <ClusterCard title="Shared fingerprint" kind="fingerprint" clusters={fpClusters} />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-white/50">
        Recently flagged accounts
      </h2>
      {flaggedRows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-panel/60 p-8 text-center text-sm text-white/40">
          No flagged signups. 🎉
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-[11px] uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-2.5">User</th>
                <th className="px-3 py-2.5">IP</th>
                <th className="px-3 py-2.5">Fingerprint</th>
                <th className="px-3 py-2.5 text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {flaggedRows.slice(0, 100).map((r) => (
                <tr key={r.user_id} className="border-t border-white/5">
                  <td className="px-4 py-2.5 font-mono text-xs text-white/60">{r.user_id.slice(0, 8)}…</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{r.ip ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-white/60">{r.fingerprint ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right text-white/50">{when(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ClusterCard({ title, kind, clusters }: { title: string; kind: string; clusters: Cluster[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel/60 p-5">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {clusters.length === 0 ? (
        <p className="text-sm text-white/40">No clusters.</p>
      ) : (
        <ul className="space-y-2">
          {clusters.map((c) => (
            <li
              key={c.value}
              className="flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    {c.count} accounts
                  </span>
                  <span className="truncate font-mono text-xs text-white/70">{c.value}</span>
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/30">
                  {kind} · latest {when(c.latest)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
