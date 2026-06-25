// Central event layer — one place that fans a player action out to XP (Season
// Pass), challenge progress, pack history, and notifications. Pages call these
// instead of poking each subsystem individually.
import { Card } from "@/lib/myteam/cards";
import { addXp } from "@/lib/myteam/seasonPass";
import { trackMetric } from "@/lib/myteam/challenges";
import { logPackOpen } from "@/lib/store/packHistory";
import { pushNotification } from "@/lib/store/notifications";

export function onGamePlayed(won: boolean, opts: { vsRival?: boolean } = {}) {
  addXp(won ? 75 : 40);
  trackMetric("gamesPlayed");
  if (won) {
    trackMetric("gamesWon");
    if (opts.vsRival) trackMetric("rivalsBeaten");
  }
}

export function onPackOpened(source: string, cards: Card[]) {
  logPackOpen(source, cards.map((c) => c.id));
  addXp(25 + cards.length * 5);
  trackMetric("packsOpened");
}

export function onCardUpgraded() {
  addXp(15);
  trackMetric("cardsUpgraded");
}

export function onAuctionSold(text: string) {
  pushNotification("auction", text);
  trackMetric("auctionSold");
  addXp(20);
}

export function onAuctionOutbid(text: string) {
  pushNotification("outbid", text);
}
