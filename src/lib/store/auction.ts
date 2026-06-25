// MyTeam — Auction House marketplace.
//
// NOTE: this is a *simulated* live market so it works in guest/local mode with
// no backend. Listings come from bot sellers, bot bidders compete and snipe
// over time, and auctions expire and resolve against the player's real coin
// balance + collection. To make this genuinely cross-user, replace the
// localStorage read/write + `tickMarket` bot logic with Supabase tables
// (listings, bids) + realtime subscriptions; the public API below would stay
// the same.
import {
  Card,
  CARDS_BY_RARITY,
  RARITY_ORDER,
  Rarity,
  cardById,
  quickSellValue,
} from "@/lib/myteam/cards";
import {
  addCoins,
  getCoins,
  spendCoins,
  addOwned,
  removeOwned,
} from "@/lib/store/myteam";

const LISTINGS_KEY = "dynasty.auction.listings";
const ESCROW_KEY = "dynasty.auction.escrow";
const SEED_KEY = "dynasty.auction.seeded";

const MAX_ACTIVE = 16;
const YOU = "You";

export interface Listing {
  id: string;
  cardId: string;
  seller: string;
  mine: boolean;
  startingBid: number;
  buyNow: number | null;
  currentBid: number; // highest bid; equals startingBid floor while bidCount === 0
  bidCount: number;
  highBidder: string | null;
  youHighBidder: boolean;
  endsAt: number; // epoch ms
  createdAt: number;
}

const BOT_NAMES = [
  "HoopChef", "DimeDropper", "GlassCleaner", "AnkleBreaker", "SwishKing",
  "PaintBeast", "ColdBlooded", "FastBreak22", "BuzzerBeater", "RimRocker",
  "ClutchGene", "TripleDouble", "BenchMob", "FadeawayFred", "PosterChild",
];

/* ---------------- storage helpers ---------------- */
function readListings(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LISTINGS_KEY) || "[]") as Listing[];
  } catch {
    return [];
  }
}
function writeListings(l: Listing[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(l));
}
function readEscrow(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ESCROW_KEY) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}
function writeEscrow(e: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ESCROW_KEY, JSON.stringify(e));
}

/* ---------------- pricing + rng helpers ---------------- */
function rnd(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rollRarity(): Rarity {
  const weights: Record<Rarity, number> = {
    Bronze: 40, Silver: 30, Gold: 22, Diamond: 7, Dynasty: 1,
  };
  const total = RARITY_ORDER.reduce((a, r) => a + weights[r], 0);
  let t = Math.random() * total;
  for (const r of RARITY_ORDER) {
    t -= weights[r];
    if (t <= 0) return r;
  }
  return "Bronze";
}
function randomCard(): Card {
  for (let i = 0; i < 8; i++) {
    const pool = CARDS_BY_RARITY[rollRarity()];
    if (pool.length) return pick(pool);
  }
  return CARDS_BY_RARITY.Bronze[0] ?? CARDS_BY_RARITY.Gold[0];
}

export function minIncrement(current: number): number {
  return Math.max(25, Math.round(current * 0.05));
}

function makeId(): string {
  return `lst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function botListing(now: number): Listing {
  const card = randomCard();
  const base = quickSellValue(card.rarity);
  const startingBid = Math.max(25, Math.round((base * rnd(0.4, 0.85)) / 5) * 5);
  const hasBuyNow = Math.random() < 0.7;
  const buyNow = hasBuyNow
    ? Math.round((startingBid * rnd(2.2, 3.6)) / 25) * 25
    : null;
  return {
    id: makeId(),
    cardId: card.id,
    seller: pick(BOT_NAMES),
    mine: false,
    startingBid,
    buyNow,
    currentBid: startingBid,
    bidCount: 0,
    highBidder: null,
    youHighBidder: false,
    endsAt: now + rnd(2, 20) * 60_000,
    createdAt: now,
  };
}

/* ---------------- public API ---------------- */
export function getListings(): Listing[] {
  return readListings().sort((a, b) => a.endsAt - b.endsAt);
}

/** Seed the market once, then keep it alive. Safe to call on every mount. */
export function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  localStorage.setItem(SEED_KEY, "1");
  const now = Date.now();
  const seed: Listing[] = [];
  for (let i = 0; i < 10; i++) seed.push(botListing(now));
  writeListings(seed);
}

/** Advance the simulated market: resolve ended auctions, let bots bid/snipe,
 *  and occasionally spawn fresh listings. Returns any notifications for the user. */
export function tickMarket(): string[] {
  if (typeof window === "undefined") return [];
  const now = Date.now();
  const listings = readListings();
  const escrow = readEscrow();
  const notes: string[] = [];
  const survivors: Listing[] = [];

  for (const l of listings) {
    if (l.endsAt <= now) {
      // resolve
      if (l.mine) {
        if (l.bidCount > 0) {
          addCoins(l.currentBid);
          notes.push(`Sold ${cardName(l.cardId)} for ${l.currentBid.toLocaleString()} 🪙`);
        } else {
          addOwned([l.cardId]);
          notes.push(`${cardName(l.cardId)} didn't sell — returned to your collection.`);
        }
      } else if (l.youHighBidder) {
        addOwned([l.cardId]); // escrow already paid at bid time
        delete escrow[l.id];
        notes.push(`You won ${cardName(l.cardId)} for ${l.currentBid.toLocaleString()} 🪙!`);
      }
      if (escrow[l.id] != null && !l.youHighBidder) {
        addCoins(escrow[l.id]);
        delete escrow[l.id];
      }
      continue;
    }

    // bot bidding — likelier as time runs low and on shinier cards
    const card = cardById(l.cardId);
    const timeLeft = l.endsAt - now;
    const urgency = timeLeft < 60_000 ? 0.55 : timeLeft < 5 * 60_000 ? 0.3 : 0.16;
    const rarityPull = card ? 1 + RARITY_ORDER.indexOf(card.rarity) * 0.12 : 1;
    const willBid =
      Math.random() < urgency * rarityPull &&
      l.highBidder !== null
        ? true
        : l.bidCount === 0 && Math.random() < urgency * 0.6;

    if (willBid) {
      const next = l.bidCount === 0 ? l.startingBid : l.currentBid + minIncrement(l.currentBid);
      // a bot outbidding the user refunds the user's escrow
      if (l.youHighBidder && escrow[l.id] != null) {
        addCoins(escrow[l.id]);
        delete escrow[l.id];
        notes.push(`You were outbid on ${cardName(l.cardId)}.`);
      }
      // don't let a bot raise itself unnecessarily for no-bid listings far from end
      l.currentBid = next;
      l.bidCount += 1;
      l.highBidder = pickBotNot(l.highBidder);
      l.youHighBidder = false;
    }

    survivors.push(l);
  }

  // keep the market lively
  const activeBots = survivors.filter((l) => !l.mine).length;
  if (activeBots < MAX_ACTIVE && Math.random() < 0.35) {
    survivors.push(botListing(now));
  }

  writeListings(survivors);
  writeEscrow(escrow);
  return notes;
}

function pickBotNot(name: string | null): string {
  let n = pick(BOT_NAMES);
  for (let i = 0; i < 4 && n === name; i++) n = pick(BOT_NAMES);
  return n;
}
function cardName(id: string): string {
  return cardById(id)?.name ?? "card";
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export function placeBid(id: string, amount: number): ActionResult {
  const listings = readListings();
  const l = listings.find((x) => x.id === id);
  if (!l) return { ok: false, error: "Listing no longer available." };
  if (l.mine) return { ok: false, error: "You can't bid on your own listing." };
  if (l.endsAt <= Date.now()) return { ok: false, error: "This auction has ended." };
  if (l.youHighBidder) return { ok: false, error: "You're already the high bidder." };

  const min = l.bidCount === 0 ? l.startingBid : l.currentBid + minIncrement(l.currentBid);
  if (amount < min) return { ok: false, error: `Bid at least ${min.toLocaleString()} 🪙.` };
  if (getCoins() < amount) return { ok: false, error: "Not enough coins." };

  spendCoins(amount);
  const escrow = readEscrow();
  escrow[id] = amount; // held until you win or get outbid
  writeEscrow(escrow);

  l.currentBid = amount;
  l.bidCount += 1;
  l.highBidder = YOU;
  l.youHighBidder = true;
  // light anti-snipe: a late bid nudges the clock
  if (l.endsAt - Date.now() < 30_000) l.endsAt += 30_000;
  writeListings(listings);
  return { ok: true };
}

export function buyNow(id: string): ActionResult {
  const listings = readListings();
  const l = listings.find((x) => x.id === id);
  if (!l) return { ok: false, error: "Listing no longer available." };
  if (l.mine) return { ok: false, error: "You can't buy your own listing." };
  if (l.buyNow == null) return { ok: false, error: "No buy-now price set." };

  const escrow = readEscrow();
  const held = escrow[id] ?? 0;
  // need to cover the gap beyond any coins you already have escrowed on this lot
  if (getCoins() + held < l.buyNow) return { ok: false, error: "Not enough coins." };

  if (held) {
    addCoins(held); // release your bid escrow back, then pay buy-now in full
    delete escrow[id];
    writeEscrow(escrow);
  }
  spendCoins(l.buyNow);
  addOwned([l.cardId]);
  writeListings(listings.filter((x) => x.id !== id));
  return { ok: true };
}

export function listCard(
  iid: string,
  cardId: string,
  startingBid: number,
  buyNowPrice: number | null,
  durationMs: number
): ActionResult {
  if (startingBid < 25) return { ok: false, error: "Starting bid must be at least 25." };
  if (buyNowPrice != null && buyNowPrice <= startingBid)
    return { ok: false, error: "Buy-now must be higher than the starting bid." };
  if (!removeOwned(iid)) return { ok: false, error: "You no longer own that card." };

  const now = Date.now();
  const listings = readListings();
  listings.push({
    id: makeId(),
    cardId,
    seller: YOU,
    mine: true,
    startingBid,
    buyNow: buyNowPrice,
    currentBid: startingBid,
    bidCount: 0,
    highBidder: null,
    youHighBidder: false,
    endsAt: now + durationMs,
    createdAt: now,
  });
  writeListings(listings);
  return { ok: true };
}

export function cancelListing(id: string): ActionResult {
  const listings = readListings();
  const l = listings.find((x) => x.id === id);
  if (!l || !l.mine) return { ok: false, error: "Listing not found." };
  if (l.bidCount > 0) return { ok: false, error: "Can't cancel — it already has bids." };
  addOwned([l.cardId]);
  writeListings(listings.filter((x) => x.id !== id));
  return { ok: true };
}

/** Listings the user is currently the high bidder on (live escrowed bids). */
export function myBids(): Listing[] {
  return getListings().filter((l) => l.youHighBidder);
}
export function myListings(): Listing[] {
  return getListings().filter((l) => l.mine);
}
