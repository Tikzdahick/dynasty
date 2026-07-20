import Link from "next/link";
import { cookies } from "next/headers";
import { FLAGS, FLAGS_COOKIE, effectiveFlags, parseOverrides } from "@/lib/flags/flags";

export const dynamic = "force-dynamic";

export default function AdminFlags() {
  const overrides = parseOverrides(cookies().get(FLAGS_COOKIE)?.value);
  const effective = effectiveFlags(overrides);

  return (
    <div className="py-2">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-white/40 hover:text-white">
          ← Admin
        </Link>
        <h1 className="mt-1 text-3xl font-black">🚩 Feature Flags</h1>
        <p className="text-sm text-white/50">
          Toggle a flag to override it <span className="font-semibold text-white/70">for this browser</span> —
          the way to test a feature before rolling it out. The global default lives in code
          (<code className="text-white/60">src/lib/flags/flags.ts</code>); changing it for everyone is a
          one-line edit + redeploy.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-[11px] uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-2.5">Flag</th>
              <th className="px-3 py-2.5">Default</th>
              <th className="px-3 py-2.5">This browser</th>
              <th className="px-3 py-2.5 text-right">Set for this browser</th>
            </tr>
          </thead>
          <tbody>
            {FLAGS.map((f) => {
              const overridden = f.key in overrides;
              const on = effective[f.key];
              return (
                <tr key={f.key} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold">
                      {f.label}
                      {!f.wired && (
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/35">
                          not wired
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/45">{f.description}</div>
                    <code className="text-[10px] text-white/30">{f.key}</code>
                  </td>
                  <td className="px-3 py-3">
                    <Pill on={f.default} muted />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Pill on={on} />
                      {overridden && (
                        <span className="text-[10px] font-semibold text-amber-300">override</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1.5">
                      <FlagBtn flag={f.key} action="on" label="On" active={overridden && on} />
                      <FlagBtn flag={f.key} action="off" label="Off" active={overridden && !on} />
                      <FlagBtn flag={f.key} action="reset" label="Reset" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-white/30">
        Overrides are stored in the <code>dyn_flags</code> cookie on this browser only. Wired flags take
        effect immediately on the game pages; “not wired” flags are defined but don’t gate anything yet.
      </p>
    </div>
  );
}

function Pill({ on, muted = false }: { on: boolean; muted?: boolean }) {
  const base = "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide";
  if (on) return <span className={`${base} ${muted ? "bg-emerald-400/10 text-emerald-300/70" : "bg-emerald-400/20 text-emerald-300"}`}>On</span>;
  return <span className={`${base} ${muted ? "bg-white/5 text-white/40" : "bg-white/10 text-white/50"}`}>Off</span>;
}

function FlagBtn({
  flag,
  action,
  label,
  active = false,
}: {
  flag: string;
  action: string;
  label: string;
  active?: boolean;
}) {
  return (
    <form method="post" action="/api/admin/flags">
      <input type="hidden" name="key" value={flag} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
          active
            ? "border-white/40 bg-white text-black"
            : "border-white/10 bg-panel text-white/60 hover:border-white/30 hover:text-white"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
