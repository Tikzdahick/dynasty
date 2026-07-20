export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  "1": "Incorrect password.",
  unconfigured: "Admin access is not configured on this server (ADMIN_PASSWORD is unset).",
};

export default function AdminLogin({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const message = searchParams.error ? MESSAGES[searchParams.error] ?? "Access denied." : null;
  const next = searchParams.next ?? "";

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form
        method="post"
        action="/api/admin/login"
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-panel/70 p-6"
      >
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
          Dynasty
        </div>
        <h1 className="mb-1 text-2xl font-black">Admin access</h1>
        <p className="mb-5 text-sm text-white/50">Enter the admin password to continue.</p>

        {message && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {message}
          </div>
        )}

        <label className="mb-1 block text-xs font-semibold text-white/60" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-white/30"
        />
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="w-full rounded-lg bg-white px-4 py-2 font-bold text-black transition hover:bg-white/90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
