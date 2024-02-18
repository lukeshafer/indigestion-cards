import { validateSearchParams, SiteHandler } from '@lib/api';
import { getPackTypeById } from '@lib/pack-type';
import { getRemainingPossibleCardsFromCardPool, getCardPoolFromType } from '@lib/card-pool';
import { SHIT_PACK_RARITY_ID } from '@lil-indigestion-cards/core/constants';

export const handler = SiteHandler({ authorizationType: 'admin' }, async evt => {
  const validatedParams = await validateSearchParams(new URLSearchParams(evt.rawQueryString), {
    remainingCardCount: 'number',
    packTypeId: 'string',
  });

  if (!validatedParams.success)
    return { statusCode: 400, body: validatedParams.errors.join(', ') };

  const args = validatedParams.value;

  const shitPackOdds = await getShitPackOdds(args);

  return {
    statusCode: 200,
    body: JSON.stringify({
      shitPackOdds,
    }),
  };
});

async function getShitPackOdds(args: {
  remainingCardCount: number;
  packTypeId: string;
}): Promise<number> {
  // if no cards are remaining, then we have a shit pack!
  if (args.remainingCardCount === 0) return 1;

  // Get all the remaining cards for the pack type
  const cardPool = await getPackTypeById(args).then(getCardPoolFromType);
  const remainingCardsInPool = [
    ...getRemainingPossibleCardsFromCardPool(cardPool),
    ...cardPool.cardInstances.filter(card => !card.openedAt),
  ];
  const bronzesRemaining = remainingCardsInPool.filter(card =>
    card.rarityId.startsWith(SHIT_PACK_RARITY_ID)
  );
  const oddsOfBronze = bronzesRemaining.length / remainingCardsInPool.length;

  const shitPackOdds = Math.pow(oddsOfBronze, args.remainingCardCount);
  console.log('Calculated shit pack odds: ', shitPackOdds);

  return shitPackOdds;
}
