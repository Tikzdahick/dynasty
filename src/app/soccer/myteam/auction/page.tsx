"use client";

import { AuctionHouse } from "@/components/auction/AuctionHouse";
import { cardById } from "@/lib/soccer-myteam/cards";
import { PlayerCard } from "@/components/soccer-myteam/PlayerCard";
import { getOwned, getCoins } from "@/lib/store/soccer/myteam";

export default function SoccerAuctionPage() {
  return (
    <AuctionHouse
      sport="soccer"
      accent="bg-soccer"
      cardById={cardById}
      PlayerCard={PlayerCard}
      getOwned={getOwned}
      getCoins={getCoins}
      homeHref="/soccer/myteam"
    />
  );
}
