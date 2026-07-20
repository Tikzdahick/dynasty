import Link from "next/link";
import { cookies } from "next/headers";
import {
  REDEEM_CODES,
  REDEEM_COOKIE,
  effectiveCodes,
  normalizeCode,
  parseOverrides,
} from "@/lib/redeem/codes";

export const dynamic = "force-dynamic";

export default function AdminRedeem() {
  const overrides = parseOverrides(cookies().get(REDEEM_COOKIE)?.value);
  const codes = effectiveCodes(overrides);
  const shipped = new Set(REDEEM_CODES.map((c) => normalizeCode(c.code)));

  return (
    <div className="py-2">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-white/40 hover:text-white">
          ← Admin
        </Link>
        <h1 className="mt-1 text-3xl font-black">🎟️ Redeem Codes</h1>
        <p className="max-w-2xl text-sm text-white/50">
          Codes players can enter at <code className="text-white/60">/redeem</code> for coins. Toggling
          active or adding a code here applies <span className="font-semibold text-white/70">to this browser</span>{" "}
          (for testing). To ship a code to <span className="font-semibold text-white/70">all players</span>, add it
          to <code className="text-white/60">src/lib/redeem/codes.ts</code> and redeploy — there’s no shared DB.
        </p>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-[11px] uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-2.5">Code</th>
              <th className="px-3 py-2.5">Reward</th>
              <th className="px-3 py-2.5">Max uses</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => {
              const isShipped = shipped.has(normalizeCode(c.code));
              return (
                <tr key={c.code} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold tracking-widest">{c.code}</span>
                    {!isShipped && (
                      <span className="ml-2 rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                        this browser
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {c.reward_amount.toLocaleString()} {c.reward_type}
                  </td>
                  <td className="px-3 py-3 text-white/60">{c.max_uses == null ? "∞" : c.max_uses}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.active ? "bg-emerald-400/20 text-emerald-300" : "bg-white/10 text-white/50"
                      }`}
                    >
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1.5">
                      <ActionBtn action="toggle" code={c.code} active={!c.active} label={c.active ? "Deactivate" : "Activate"} />
                      {!isShipped && <ActionBtn action="remove" code={c.code} label="Remove" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* create code (this browser) */}
      <form
        method="post"
        action="/api/admin/redeem"
        className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-panel/60 p-4"
      >
        <input type="hidden" name="action" value="add" />
        <Field label="Code" name="code" placeholder="WELCOME" />
        <Field label="Coins" name="amount" type="number" placeholder="50000" />
        <Field label="Max uses (blank = ∞)" name="max_uses" type="number" placeholder="" />
        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90"
        >
          Add code (this browser)
        </button>
      </form>

      <form method="post" action="/api/admin/redeem">
        <input type="hidden" name="action" value="reset" />
        <button
          type="submit"
          className="rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Reset overrides
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">
        {label}
      </label>
      <input
        name={name}
        type={type}
        min={type === "number" ? 0 : undefined}
        placeholder={placeholder}
        className="w-36 rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
      />
    </div>
  );
}

function ActionBtn({
  action,
  code,
  active,
  label,
}: {
  action: string;
  code: string;
  active?: boolean;
  label: string;
}) {
  return (
    <form method="post" action="/api/admin/redeem">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="code" value={code} />
      {active !== undefined && <input type="hidden" name="active" value={String(active)} />}
      <button
        type="submit"
        className="rounded-lg border border-white/10 bg-panel px-2.5 py-1 text-xs font-semibold text-white/60 transition hover:border-white/30 hover:text-white"
      >
        {label}
      </button>
    </form>
  );
}
