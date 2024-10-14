import { validateSearchParams, SiteHandler } from '@core/lib/api';
import { getPackTypeById } from '@core/lib/pack-type';
import { getRemainingPossibleCardsFromCardPool, getCardPoolFromType } from '@core/lib/card-pool';
import { SHIT_PACK_RARITY_ID } from '@core/constants';

export const handler = SiteHandler({ authorizationType: 'admin' }, async evt => {
	const validatedParams = await validateSearchParams(new URLSearchParams(evt.rawQueryString), {
		remainingCardCount: 'number',
		packTypeId: 'string',
		rarityId: 'string?',
	});

	if (!validatedParams.success)
		return { statusCode: 400, body: validatedParams.errors.join(', ') };

	const params = validatedParams.value;

	const shitPackOdds = await getShitPackOdds({
		packTypeId: params.packTypeId,
		remainingCardCount: params.remainingCardCount,
		rarityIdToCheck: params.rarityId || SHIT_PACK_RARITY_ID,
	});

	return {
		statusCode: 200,
		body: JSON.stringify({
			shitPackOdds,
		}),
	};
});

async function getShitPackOdds(args: {
	rarityIdToCheck: string;
	remainingCardCount: number;
	packTypeId: string;
}): Promise<number> {
	// if no cards are remaining, then we have a shit pack!
	if (args.remainingCardCount === 0) return 1;

	/** All the existing cards for the pack type (i.e. either in a pack currently or opened) */
	const cardPool = await getPackTypeById(args).then(getCardPoolFromType);

	/** Remaining possible cards that have not been *opened* yet */
	const remainingCardsInPool = [
		...getRemainingPossibleCardsFromCardPool(cardPool), // cards not yet assigned to a pack
		...cardPool.CardInstances.filter(card => !card.openedAt), // cards assigned to a pack but not opened
	];

	/** Unopened and unassigned cards of the rarity we're checking for shit pack (usually bronze) */
	const remainingCardsOfRarityToCheck = remainingCardsInPool.filter(card =>
		card.rarityId.startsWith(args.rarityIdToCheck)
	);
	const baselineTotalOfType = remainingCardsOfRarityToCheck[0]?.totalOfType;

	/**
	 * The card pool minus any cards that are *less* rare than what we're checking
	 * Reason: if we're checking a silver shit pack, we shouldn't include bronze in the count
	 *  because at that point it's impossible for a bronze to appear
	 */
	const remainingCardsInPoolWithoutLessRareCards = baselineTotalOfType
		? remainingCardsInPool.filter(card => card.totalOfType <= baselineTotalOfType)
		: remainingCardsInPool;

	const oddsOfRarityToCheckInNextCard =
		remainingCardsOfRarityToCheck.length / remainingCardsInPoolWithoutLessRareCards.length;

	let shitPackOdds = 1;

	for (let i = 0; i < args.remainingCardCount; i++) {
		// Every card drawn will reduce the count of remaining cards by 1

		shitPackOdds *=
			(remainingCardsOfRarityToCheck.length - i) /
			(remainingCardsInPoolWithoutLessRareCards.length - i);
	}

	console.log('Calculated stats:', {
		'Rarity ID checked': args.rarityIdToCheck,
		'Total remaining cards to draw': remainingCardsInPool.length,
		'Total remaining cards of rarity': remainingCardsOfRarityToCheck.length,
		'Total remaining cards to draw, minus those of less rarity':
			remainingCardsInPoolWithoutLessRareCards.length,
		'Odds of next card being the rarity ID to check': oddsOfRarityToCheckInNextCard,
		'Remaining card count': args.remainingCardCount,
		'Calculated shit pack odds': shitPackOdds,
	});

	return shitPackOdds;
}
