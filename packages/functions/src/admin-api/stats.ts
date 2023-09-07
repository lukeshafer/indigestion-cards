import { validateSearchParams, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import {
	getPackTypeById,
	getRemainingPossibleCardsFromCardPool,
} from '@lil-indigestion-cards/core/card';
import { getCardPoolFromType } from '@lil-indigestion-cards/core/pack';

export const handler = ProtectedApiHandler(async (evt) => {
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
	const remainingCardsInPool = await getPackTypeById(args)
		.then(getCardPoolFromType)
		.then(getRemainingPossibleCardsFromCardPool);

	const bronzesRemaining = remainingCardsInPool.filter((card) => card.totalOfType >= 50);

	const oddsOfBronze = bronzesRemaining.length / remainingCardsInPool.length;

	const shitPackOdds = Math.pow(oddsOfBronze, args.remainingCardCount);
	console.log('Calculated shit pack odds: ', shitPackOdds);

	return shitPackOdds;
}

//async function getShitPackOdds(packId: string): Promise<number> {
	//// What are the odds of a shit pack for a given Pack

	//// 1. Get the pack
	//const pack = await getPackById({ packId });
	//const openedCards = pack.cardDetails.filter((card) => card.opened);

	//// if any opened cards have a rarity lower than 50, it can't be a shit pack
	//if (openedCards.some((card) => card.totalOfType < 50)) return 0;

	//const remainingCardCount = pack.cardDetails.length - openedCards.length;
	//// if no cards are remaining, then we have a shit pack!
	//if (remainingCardCount === 0) return 1;

	//const packType = await getPackTypeById(pack);

	//// 2. Get all the remaining cards for the pack type
	//const remainingCardsInPool = await getCardPoolFromType(packType).then(
		//getRemainingPossibleCardsFromCardPool
	//);

	//const bronzesRemaining = remainingCardsInPool.filter((card) => card.totalOfType >= 50);

	//const oddsOfBronze = bronzesRemaining.length / remainingCardsInPool.length;

	//const shitPackOdds = Math.pow(oddsOfBronze, remainingCardCount);
	//console.log('Calculated shit pack odds: ', shitPackOdds);
	//return shitPackOdds;
//}
