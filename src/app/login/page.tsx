"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { configured, signInWithPassword, signUp, signInWithMagicLink, signInWithGoogle, setGuestName } =
    useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [guest, setGuest] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const err =
      mode === "signin"
        ? await signInWithPassword(email, password)
        : await signUp(email, password, displayName);
    setBusy(false);
    if (err) setError(err);
    else if (mode === "signup") setNotice("Account created. If email confirmation is on, check your inbox to verify, then sign in.");
    else router.push("/profile");
  };

  const magicLink = async () => {
    if (!email.trim()) {
      setError("Enter your email first, then request a magic link.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const err = await signInWithMagicLink(email);
    setBusy(false);
    if (err) setError(err);
    else setNotice("Magic link sent — check your email and click it to sign in.");
  };

  const google = async () => {
    setError(null);
    const err = await signInWithGoogle();
    if (err) setError(err);
  };

  const playAsGuest = () => {
    if (guest.trim()) setGuestName(guest.trim());
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-md bg-grain pt-6">
      <h1 className="text-center text-3xl font-black">
        <span className="bg-gradient-to-r from-nba to-soccer bg-clip-text text-transparent">
          Dynasty
        </span>
      </h1>
      <p className="mb-8 text-center text-sm text-white/50">
        Sign in to save your dynasties to the global leaderboard.
      </p>

      {!configured && (
        <div className="card mb-6 p-4 text-center text-sm text-white/50">
          Cloud auth isn&apos;t configured yet. You can still play and save locally as a
          guest below.
        </div>
      )}

      {configured && (
        <>
          <div className="mb-4 flex rounded-xl bg-white/5 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  mode === m ? "bg-white/10 text-white" : "text-white/50"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name (shown on the leaderboard)"
                className="w-full rounded-xl border border-white/10 bg-panel px-4 py-3 text-sm outline-none focus:border-white/30"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-white/10 bg-panel px-4 py-3 text-sm outline-none focus:border-white/30"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-white/10 bg-panel px-4 py-3 text-sm outline-none focus:border-white/30"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn w-full bg-white text-black hover:bg-white/90"
            >
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button onClick={magicLink} disabled={busy} className="btn-ghost mt-3 w-full">
            ✉️ Email me a magic link
          </button>
          <button onClick={google} className="btn-ghost mt-2 w-full">
            <span className="text-base">G</span> Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-white/30">
            <div className="h-px flex-1 bg-white/10" />
            OR
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}

      {/* Guest */}
      <div className="card p-4">
        <p className="mb-2 text-sm font-semibold">Play as guest</p>
        <p className="mb-3 text-xs text-white/40">
          Jump straight in. Results save on this device.
        </p>
        <div className="flex gap-2">
          <input
            value={guest}
            onChange={(e) => setGuest(e.target.value)}
            placeholder="Display name"
            className="flex-1 rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-sm outline-none focus:border-white/30"
          />
          <button onClick={playAsGuest} className="btn-ghost">
            Play →
          </button>
        </div>
      </div>

      {notice && (
        <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}

      <Link href="/" className="mt-6 block text-center text-sm text-white/40 hover:text-white">
        ← Back home
      </Link>
    </div>
  );
}
