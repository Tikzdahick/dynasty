import Link from "next/link";

export const dynamic = "force-dynamic";

type Section = {
  title: string;
  icon: string;
  desc: string;
  status: "planned" | "live";
  href?: string;
};

// The dashboard shell. Each section is added incrementally.
const SECTIONS: Section[] = [
  { title: "Feature Flags", icon: "🚩", desc: "Toggle features globally or for your own browser before rolling out.", status: "live", href: "/admin/flags" },
  { title: "Pack Odds", icon: "🎴", desc: "View and adjust pull-rate percentages per rarity, per pack type.", status: "live", href: "/admin/odds" },
  { title: "Redeem Codes", icon: "🎟️", desc: "Manage codes players redeem for coins — activate/deactivate and add test codes.", status: "live", href: "/admin/redeem" },
  { title: "Duplicate Signups", icon: "🕵️", desc: "Accounts sharing an IP or fingerprint in a short window — flagged for review, no auto-ban.", status: "live", href: "/admin/signups" },
  { title: "SBC Management", icon: "🧩", desc: "Create/edit/delete Squad Building Challenges — requirements, rewards, active dates.", status: "planned" },
  { title: "Auction Moderation", icon: "🔨", desc: "View listings, cancel/remove any, flag or ban users.", status: "planned" },
  { title: "Error Logs", icon: "🐛", desc: "Filterable list of unhandled errors with timestamp and context.", status: "planned" },
  { title: "Economy", icon: "📈", desc: "Coins in circulation, avg pack price, avg sale price; earned vs spent per day.", status: "planned" },
];

export default function AdminDashboard() {
  return (
    <div className="py-2">
      {/* header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Dynasty
          </div>
          <h1 className="text-3xl font-black">Admin Dashboard</h1>
          <p className="text-sm text-white/50">
            Manage the app without touching code. Sections roll out incrementally.
          </p>
        </div>
        <form method="post" action="/api/admin/logout">
          <button
            type="submit"
            className="rounded-lg border border-white/10 bg-panel px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* sections grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const live = s.status === "live" && s.href;
          const inner = (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
                {live ? (
                  <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                    Open →
                  </span>
                ) : (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/40">
                    Coming soon
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold">{s.title}</h2>
              <p className="mt-1 text-sm text-white/50">{s.desc}</p>
            </>
          );
          return live ? (
            <Link
              key={s.title}
              href={s.href!}
              className="relative rounded-2xl border border-white/10 bg-panel/60 p-5 transition hover:border-emerald-400/40 hover:bg-panel"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={s.title}
              className="relative rounded-2xl border border-white/10 bg-panel/60 p-5"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-white/30">
        Access is gated server-side by a signed admin cookie (Edge middleware). This
        page never renders for an unauthenticated request.
      </p>
    </div>
  );
}
