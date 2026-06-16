"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/", label: "Home", desktopOnly: false },
  { href: "/leaderboard", label: "Leaderboard", desktopOnly: false },
  { href: "/how-to-play", label: "How to Play", desktopOnly: true },
  { href: "/profile", label: "Profile", desktopOnly: false },
];

export function Nav() {
  const pathname = usePathname();
  const { user, displayName } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight">
            <span className="bg-gradient-to-r from-nba via-amber-300 to-soccer bg-clip-text text-transparent">
              DYNASTY
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  l.desktopOnly ? "hidden sm:inline-flex" : ""
                } ${active ? "bg-white/10 text-white" : "text-white/55 hover:text-white"}`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href={user ? "/profile" : "/login"}
            className="ml-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/5"
          >
            {user ? `@${displayName}` : "Sign in"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
