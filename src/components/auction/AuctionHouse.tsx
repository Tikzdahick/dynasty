"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { resync } from "@/lib/store/cloud";
import { Listing, Sport, buyListing, cancelListing, getMarket, listCard } from "@/lib/store/auctionCloud";

interface OwnedCard {
  iid: string;
  cardId: string;
}

type CardLike = { name: string; overall: number } | undefined;

interface Props {
  sport: Sport;
  accent: string; // tailwind bg token, e.g. "bg-nba"
  cardById: (id: string) => any;
  PlayerCard: React.ComponentType<{ card: any; size?: "sm" | "md" | "lg"; onClick?: () => void }>;
  getOwned: () => OwnedCard[];
  getCoins: () => number;
  homeHref: string;
}

type Tab = "market" | "mine" | "sell";

export function AuctionHouse({ sport, accent, cardById, PlayerCard, getOwned, getCoins, homeHref }: Props) {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("market");
  const [listings, setListings] = useState<Listing[]>([]);
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [coins, setCoins] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const reload = useCallback(async () => {
    await resync(sport); // fresh coins + owned cards from the server
    setOwned(getOwned());
    setCoins(getCoins());
    setListings(await getMarket(sport));
  }, [sport, getOwned, getCoins]);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  const market = useMemo(() => listings.filter((l) => !l.mine), [listings]);
  const mine = useMemo(() => listings.filter((l) => l.mine), [listings]);

  async function afterMutation(text: string) {
    await resync(sport); // pull the new coins + cards into the local cache
    await reload();
    setMsg({ ok: true, text });
  }

  async function onBuy(l: Listing) {
    setBusy(l.id);
    setMsg(null);
    const err = await buyListing(l.id);
    setBusy(null);
    if (err) setMsg({ ok: false, text: prettyErr(err) });
    else await afterMutation(`Bought ${cardName(cardById, l.cardId)} for ${l.price.toLocaleString()} 🪙.`);
  }

  async function onCancel(l: Listing) {
    setBusy(l.id);
    setMsg(null);
    const err = await cancelListing(l.id);
    setBusy(null);
    if (err) setMsg({ ok: false, text: prettyErr(err) });
    else await afterMutation(`Listing cancelled — ${cardName(cardById, l.cardId)} is back in your collection.`);
  }

  async function onList(o: OwnedCard, price: number) {
    setBusy(o.iid);
    setMsg(null);
    const err = await listCard(sport, o.iid, price);
    setBusy(null);
    if (err) setMsg({ ok: false, text: prettyErr(err) });
    else {
      await afterMutation(`Listed ${cardName(cardById, o.cardId)} for ${price.toLocaleString()} 🪙.`);
      setTab("mine");
    }
  }

  if (loading) return <div className="py-10 text-center text-white/40">…</div>;

  if (!user) {
    return (
      <div className="py-2">
        <Header accent={accent} coins={null} homeHref={homeHref} />
        <div className="card p-10 text-center text-sm text-white/50">
          The Auction House trades real cards between players.{" "}
          <Link href="/login" className="text-white underline">
            Sign in
          </Link>{" "}
          to buy and sell.
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <Header accent={accent} coins={coins} homeHref={homeHref} />

      <div className="mb-4 flex gap-2">
        {(["market", "mine", "sell"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === t ? `${accent} text-black` : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            {t === "market" ? "Market" : t === "mine" ? `My listings (${mine.length})` : "Sell"}
          </button>
        ))}
      </div>

      {msg && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
            msg.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {tab === "market" &&
        (market.length === 0 ? (
          <Empty text="No cards listed yet. Be the first — head to the Sell tab." />
        ) : (
          <Grid>
            {market.map((l) => (
              <ListingCard key={l.id} card={cardById(l.cardId)} PlayerCard={PlayerCard}>
                <div className="mt-1 truncate text-[10px] text-white/40">by {l.sellerName}</div>
                <button
                  disabled={busy === l.id}
                  onClick={() => onBuy(l)}
                  className={`mt-1.5 w-full rounded-lg ${accent} py-1.5 text-xs font-bold text-black disabled:opacity-50`}
                >
                  {busy === l.id ? "…" : `Buy · ${l.price.toLocaleString()} 🪙`}
                </button>
              </ListingCard>
            ))}
          </Grid>
        ))}

      {tab === "mine" &&
        (mine.length === 0 ? (
          <Empty text="You have no active listings." />
        ) : (
          <Grid>
            {mine.map((l) => (
              <ListingCard key={l.id} card={cardById(l.cardId)} PlayerCard={PlayerCard}>
                <div className="mt-1 text-[10px] text-white/40">Listed at {l.price.toLocaleString()} 🪙</div>
                <button
                  disabled={busy === l.id}
                  onClick={() => onCancel(l)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 py-1.5 text-xs font-semibold text-white/70 hover:text-white disabled:opacity-50"
                >
                  {busy === l.id ? "…" : "Cancel listing"}
                </button>
              </ListingCard>
            ))}
          </Grid>
        ))}

      {tab === "sell" &&
        (owned.length === 0 ? (
          <Empty text="You don't own any cards to sell yet." />
        ) : (
          <Grid>
            {owned.map((o) => (
              <SellCard key={o.iid} owned={o} card={cardById(o.cardId)} PlayerCard={PlayerCard} accent={accent} busy={busy === o.iid} onList={onList} />
            ))}
          </Grid>
        ))}
    </div>
  );
}

function Header({ accent, coins, homeHref }: { accent: string; coins: number | null; homeHref: string }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <Link href={homeHref} className="text-sm text-white/40 hover:text-white">
          ← MyTeam
        </Link>
        <h1 className="mt-1 text-3xl font-black">🔨 Auction House</h1>
        <p className="text-sm text-white/50">Buy and sell cards with other players.</p>
      </div>
      {coins != null && (
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Coins</div>
          <div className={`text-2xl font-black tabular-nums ${accent.replace("bg-", "text-")}`}>{coins.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="card p-10 text-center text-sm text-white/45">{text}</div>;
}

function ListingCard({ card, PlayerCard, children }: { card: any; PlayerCard: Props["PlayerCard"]; children: React.ReactNode }) {
  return (
    <div>
      {card ? <PlayerCard card={card} size="sm" /> : <div className="aspect-[3/4] rounded-2xl bg-white/5" />}
      {children}
    </div>
  );
}

function SellCard({
  owned,
  card,
  PlayerCard,
  accent,
  busy,
  onList,
}: {
  owned: OwnedCard;
  card: CardLike;
  PlayerCard: Props["PlayerCard"];
  accent: string;
  busy: boolean;
  onList: (o: OwnedCard, price: number) => void;
}) {
  const [price, setPrice] = useState<string>("");
  const n = Math.max(0, Math.round(Number(price) || 0));
  return (
    <div>
      {card ? <PlayerCard card={card} size="sm" /> : <div className="aspect-[3/4] rounded-2xl bg-white/5" />}
      <input
        type="number"
        min={1}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price 🪙"
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-white/30"
      />
      <button
        disabled={busy || n <= 0}
        onClick={() => onList(owned, n)}
        className={`mt-1 w-full rounded-lg ${accent} py-1.5 text-xs font-bold text-black disabled:opacity-40`}
      >
        {busy ? "…" : "List"}
      </button>
    </div>
  );
}

function cardName(cardById: (id: string) => any, id: string): string {
  return cardById(id)?.name ?? "card";
}

function prettyErr(err: string): string {
  if (/insufficient/i.test(err)) return "You don't have enough coins for that.";
  if (/not available|sold/i.test(err)) return "That listing was just taken.";
  if (/own listing/i.test(err)) return "You can't buy your own listing.";
  if (/rate limited/i.test(err)) return "You're doing that too fast — slow down a moment.";
  return err;
}
