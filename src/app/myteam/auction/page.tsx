"use client";

import { AuctionHouse } from "@/components/auction/AuctionHouse";
import { cardById } from "@/lib/myteam/cards";
import { PlayerCard } from "@/components/myteam/PlayerCard";
import { getOwned, getCoins } from "@/lib/store/myteam";

export default function NbaAuctionPage() {
  return (
    <AuctionHouse
      sport="nba"
      accent="bg-nba"
      cardById={cardById}
      PlayerCard={PlayerCard}
      getOwned={getOwned}
      getCoins={getCoins}
      homeHref="/myteam"
    />
  );
}
