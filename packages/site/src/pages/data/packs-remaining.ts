import type { APIRoute } from 'astro';
import { TypedResponse } from '@site/lib/api';
import { getAllCardDesigns, getCardDesignAndInstancesById } from '@core/lib/design'
import type { CardDesign } from '@core/types';

export const GET = (async () => {
  const designs = await getAllCardDesigns();

  const designCountData = await Promise.all(designs.map(getDesignCountData))
  const counts = [...designCountData.reduce(reducer, new Map()).values()]

  return new TypedResponse(counts);
}) satisfies APIRoute;

export interface DesignCountData {
  seasonId: string;
  seasonName: string;
  ownedCards: number;
  possibleCards: number;
  remainingCards: number;
}

async function getDesignCountData(design: CardDesign): Promise<DesignCountData> {
  const { CardInstances } = await getCardDesignAndInstancesById(design)

  const ownedCards = CardInstances.length;
  const possibleCards = design.rarityDetails?.reduce((acc, rarity) => {
    return acc + rarity.count
  }, 0) ?? 0;
  const remainingCards = possibleCards - ownedCards;

  return (({
    seasonId: design.seasonId,
    seasonName: design.seasonName,
    ownedCards,
    possibleCards,
    remainingCards,
  }))
}

function reducer(map: Map<string, DesignCountData>, { seasonId, seasonName, ownedCards, remainingCards, possibleCards }: DesignCountData) {
  const prev = map.get(seasonId)
  return (map.set(seasonId, {
    seasonId,
    seasonName,
    ownedCards: ownedCards + (prev?.ownedCards ?? 0),
    possibleCards: possibleCards + (prev?.possibleCards ?? 0),
    remainingCards: remainingCards + (prev?.remainingCards ?? 0),
  }))
}
