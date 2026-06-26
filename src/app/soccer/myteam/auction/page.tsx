"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, cardById } from "@/lib/soccer-myteam/cards";
import { PlayerCard } from "@/components/soccer-myteam/PlayerCard";
import { getCoins, getOwned, OwnedCard } from "@/lib/store/soccer/myteam";
import {
  Listing,
  getListings,
  ensureSeeded,
  tickMarket,
  placeBid,
  buyNow,
  listCard,
  cancelListing,
  minIncrement,
  myBids,
  myListings,
} from "@/lib/store/soccer/auction";
import { onAuctionSold, onAuctionOutbid } from "@/lib/soccer-myteam/events";
import { pushNotification } from "@/lib/store/soccer/notifications";

type Tab = "browse" | "mine" | "bids";

const TICK_MS = 3500;

export default function AuctionPage() {
  const [now, setNow] = useState(() => Date.now());
  const [listings, setListings] = useState<Listing[]>([]);
  const [coins, setCoins] = useState(0);
  const [tab, setTab] = useState<Tab>("browse");
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [selling, setSelling] = useState(false);

  function refresh() {
    setListings(getListings());
    setCoins(getCoins());
  }

  function pushToasts(texts: string[]) {
    if (!texts.length) return;
    setToasts((prev) => [
      ...prev,
      ...texts.map((text) => ({ id: Date.now() + Math.random(), text })),
    ]);
  }

  function handleTickNotes(notes: string[]) {
    pushToasts(notes);
    for (const note of notes) {
      if (note.startsWith("Sold ")) onAuctionSold(note);
      else if (note.includes("outbid")) onAuctionOutbid(note);
      else if (note.startsWith("You won")) pushNotification("auction", note);
      else pushNotification("info", note);
    }
  }

  useEffect(() => {
    ensureSeeded();
    handleTickNotes(tickMarket());
    refresh();
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      handleTickNotes(tickMarket());
      refresh();
    }, TICK_MS);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
    return () => clearTimeout(t);
  }, [toasts]);

  const act = (r: { ok: boolean; error?: string }) => {
    if (!r.ok && r.error) pushToasts([r.error]);
    refresh();
  };

  const browse = listings.filter((l) => !l.mine);
  const mine = useMemo(() => myListings(), [listings]);
  const bids = useMemo(() => myBids(), [listings]);

  const list = tab === "browse" ? browse : tab === "mine" ? mine : bids;

  return (
    <div className="bg-grain">
      {/* toasts */}
      <div className="pointer-events-none fixed right-4 top-16 z-50 flex w-72 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="rounded-xl border border-white/10 bg-ink/95 px-3 py-2 text-sm text-white/80 shadow-lg"
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selling && (
        <SellModal
          onClose={() => setSelling(false)}
          onListed={() => {
            setSelling(false);
            setTab("mine");
            refresh();
          }}
        />
      )}

      {/* header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/soccer/myteam" className="text-sm text-white/40 hover:text-white">
            ← Soccer MyTeam
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-black">
            🏛 Auction House
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </h1>
          <p className="text-sm text-white/50">Live market — bid, snipe, and sell your cards.</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button onClick={() => setSelling(true)} className="btn bg-soccer text-black hover:bg-soccer-gold">
            + Sell a card
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-2">
            <span className="text-xl">🪙</span>
            <span className="text-xl font-black tabular-nums text-amber-300">{coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="mb-4 flex gap-2">
        <TabButton active={tab === "browse"} onClick={() => setTab("browse")}>
          Browse <Count n={browse.length} />
        </TabButton>
        <TabButton active={tab === "bids"} onClick={() => setTab("bids")}>
          My Bids <Count n={bids.length} />
        </TabButton>
        <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
          My Listings <Count n={mine.length} />
        </TabButton>
      </div>

      {list.length === 0 ? (
        <div className="card p-10 text-center text-sm text-white/45">
          {tab === "browse"
            ? "No active listings right now — the market refreshes constantly."
            : tab === "bids"
            ? "You're not the high bidder on anything yet. Go bid on a card!"
            : "You haven't listed any cards. Hit “Sell a card” to start."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => (
            <ListingRow
              key={l.id}
              listing={l}
              now={now}
              coins={coins}
              onBid={() => act(placeBid(l.id, nextBid(l)))}
              onBuy={() => act(buyNow(l.id))}
              onCancel={() => act(cancelListing(l.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function nextBid(l: Listing): number {
  return l.bidCount === 0 ? l.startingBid : l.currentBid + minIncrement(l.currentBid);
}

function ListingRow({
  listing: l,
  now,
  coins,
  onBid,
  onBuy,
  onCancel,
}: {
  listing: Listing;
  now: number;
  coins: number;
  onBid: () => void;
  onBuy: () => void;
  onCancel: () => void;
}) {
  const card = cardById(l.cardId);
  if (!card) return null;
  const left = l.endsAt - now;
  const ending = left < 60_000;
  const bid = nextBid(l);

  return (
    <div className={`card flex gap-3 p-3 ${ending ? "ring-1 ring-red-500/40" : ""}`}>
      <div className="w-24 shrink-0">
        <PlayerCard card={card} size="sm" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span className="truncate">@{l.seller}</span>
          <span className={ending ? "font-bold text-red-400" : ""}>{fmtTime(left)}</span>
        </div>

        <div className="mt-1">
          <div className="text-[10px] uppercase tracking-wide text-white/40">
            {l.bidCount === 0 ? "Starting bid" : `Current bid · ${l.bidCount}`}
          </div>
          <div className="text-lg font-black tabular-nums text-amber-300">
            🪙 {l.currentBid.toLocaleString()}
          </div>
          {l.youHighBidder ? (
            <div className="text-[11px] font-semibold text-emerald-400">You&apos;re winning</div>
          ) : l.highBidder ? (
            <div className="text-[11px] text-white/40">High: @{l.highBidder}</div>
          ) : null}
        </div>

        {/* actions */}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {l.mine ? (
            <button
              onClick={onCancel}
              disabled={l.bidCount > 0}
              className="btn flex-1 border border-white/10 px-2 py-1.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40"
            >
              {l.bidCount > 0 ? "Has bids" : "Cancel"}
            </button>
          ) : (
            <>
              <button
                onClick={onBid}
                disabled={l.youHighBidder || coins < bid}
                className="btn flex-1 bg-white/10 px-2 py-1.5 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-40"
              >
                Bid 🪙{bid.toLocaleString()}
              </button>
              {l.buyNow != null && (
                <button
                  onClick={onBuy}
                  disabled={coins < l.buyNow}
                  className="btn flex-1 bg-amber-400 px-2 py-1.5 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-40"
                >
                  Buy 🪙{l.buyNow.toLocaleString()}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SellModal({
  onClose,
  onListed,
}: {
  onClose: () => void;
  onListed: () => void;
}) {
  const owned = useMemo(() => groupOwned(getOwned()), []);
  const [selected, setSelected] = useState<{ iid: string; card: Card } | null>(null);
  const [startingBid, setStartingBid] = useState("100");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [hours, setHours] = useState(12);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!selected) return;
    const sb = parseInt(startingBid, 10);
    const bn = buyNowPrice.trim() ? parseInt(buyNowPrice, 10) : null;
    if (!sb || sb < 25) return setError("Starting bid must be at least 25.");
    if (bn != null && (isNaN(bn) || bn <= sb))
      return setError("Buy-now must be higher than the starting bid.");
    const res = listCard(selected.iid, selected.card.id, sb, bn, hours * 3_600_000);
    if (!res.ok) return setError(res.error || "Could not list card.");
    onListed();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-ink/95 p-5 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Sell a card</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {owned.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/45">
            You don&apos;t own any cards to sell yet.
          </p>
        ) : !selected ? (
          <>
            <p className="mb-2 text-sm text-white/50">Choose a card to list:</p>
            <div className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              {owned.map(({ iid, card, count }) => (
                <div key={card.id} className="relative">
                  <PlayerCard card={card} size="sm" onClick={() => setSelected({ iid, card })} />
                  {count > 1 && (
                    <span className="absolute -right-1.5 -top-1.5 rounded-full bg-white px-1.5 text-[10px] font-black text-black">
                      ×{count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-24"><PlayerCard card={selected.card} size="sm" /></div>
              <div>
                <div className="font-bold">{selected.card.name}</div>
                <button
                  onClick={() => setSelected(null)}
                  className="mt-1 text-xs text-white/40 hover:text-white"
                >
                  ← Choose a different card
                </button>
              </div>
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-white/40">
              Starting bid (🪙)
            </label>
            <input
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-sm outline-none focus:border-soccer/60"
            />

            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/40">
              Buy now (🪙) — optional
            </label>
            <input
              value={buyNowPrice}
              onChange={(e) => setBuyNowPrice(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="Leave blank for bids only"
              className="mt-1 w-full rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-sm outline-none focus:border-soccer/60"
            />

            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/40">
              Duration
            </label>
            <div className="mt-1 flex gap-2">
              {[1, 6, 12, 24].map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
                    hours === h ? "border-soccer bg-soccer/10 text-soccer" : "border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button onClick={submit} className="btn mt-4 w-full bg-soccer text-black hover:bg-soccer-gold">
              List for auction
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function groupOwned(owned: OwnedCard[]): { iid: string; card: Card; count: number }[] {
  const map = new Map<string, { iid: string; card: Card; count: number }>();
  for (const o of owned) {
    const card = cardById(o.cardId);
    if (!card) continue;
    const e = map.get(o.cardId);
    if (e) e.count++;
    else map.set(o.cardId, { iid: o.iid, card, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.card.overall - a.card.overall);
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1 text-xs text-white/30">{n}</span>;
}

function fmtTime(ms: number): string {
  if (ms <= 0) return "ending…";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `0:${String(sec).padStart(2, "0")}`;
}
