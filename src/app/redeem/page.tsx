"use client";

import { useState } from "react";
import Link from "next/link";
import { findCode } from "@/lib/redeem/codes";
import { hasRedeemed, markRedeemed, readRedeemOverrides } from "@/lib/redeem/redemptions";
import { addCoins as addNbaCoins } from "@/lib/store/myteam";
import { addCoins as addSoccerCoins } from "@/lib/store/soccer/myteam";

type Result = { ok: true; message: string } | { ok: false; message: string } | null;

export default function RedeemPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const raw = input.trim();
    if (!raw) return;
    setBusy(true);

    const code = findCode(raw, readRedeemOverrides());
    if (!code) {
      setResult({ ok: false, message: "That code isn’t valid." });
    } else if (!code.active) {
      setResult({ ok: false, message: "This code is no longer active." });
    } else if (hasRedeemed(code.code)) {
      setResult({ ok: false, message: "You’ve already redeemed this code." });
    } else {
      // credit both wallets (NBA MyTeam + Soccer MyTeam are separate balances)
      addNbaCoins(code.reward_amount);
      addSoccerCoins(code.reward_amount);
      markRedeemed(code.code);
      setResult({
        ok: true,
        message: `🎉 ${code.reward_amount.toLocaleString()} coins added to your MyTeam balances!`,
      });
      setInput("");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <h1 className="text-3xl font-black">🎁 Redeem a Code</h1>
      <p className="mb-6 mt-1 text-sm text-white/50">
        Enter a code to claim Dynasty Coins. Each code can be redeemed once.
      </p>

      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-panel/60 p-5">
        <label htmlFor="code" className="mb-1 block text-xs font-semibold text-white/60">
          Code
        </label>
        <input
          id="code"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResult(null);
          }}
          autoComplete="off"
          placeholder="e.g. 2040"
          className="mb-4 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 uppercase tracking-widest text-white outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          className="w-full rounded-lg bg-white px-4 py-2 font-bold text-black transition hover:bg-white/90 disabled:opacity-40"
        >
          Redeem
        </button>

        {result && (
          <div
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              result.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {result.message}
          </div>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-white/30">
        <Link href="/myteam" className="hover:text-white/60">
          Back to MyTeam →
        </Link>
      </p>
    </div>
  );
}
