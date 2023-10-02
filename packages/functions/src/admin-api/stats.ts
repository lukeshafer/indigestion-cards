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
	const cardPool = await getPackTypeById(args).then(getCardPoolFromType);
	const remainingCardsInPool = getRemainingPossibleCardsFromCardPool(cardPool);
	const unopenedCards = cardPool.cardInstances
		.filter((card) => !card.openedAt)
		.map(
			(card) =>
				({
					designId: card.designId,
					rarityId: card.rarityId,
					cardNumber: card.cardNumber,
					totalOfType: card.totalOfType,
				}) satisfies {
					designId: string;
					rarityId: string;
					cardNumber: number;
					totalOfType: number;
				}
		);

	const bronzesRemaining = remainingCardsInPool.filter((card) => card.totalOfType >= 50).concat(unopenedCards);

	const oddsOfBronze = bronzesRemaining.length / remainingCardsInPool.length;

	const shitPackOdds = Math.pow(oddsOfBronze, args.remainingCardCount);
	console.log('Calculated shit pack odds: ', shitPackOdds);

	return shitPackOdds;
}
