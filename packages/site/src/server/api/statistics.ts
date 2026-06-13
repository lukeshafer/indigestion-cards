import { z } from 'astro/zod';
import { adminProcedure, publicProcedure } from '../router';
import { getSeasonStatistics } from '@core/lib/stats';
import { InputValidationError } from '@core/lib/errors';
import { TRPCError } from '@trpc/server';
import { getPackTypeById } from '@core/lib/pack-type';
import { getRemainingPossibleCardsFromCardPool, getCardPoolFromType } from '@core/lib/card-pool';
import { SHIT_PACK_RARITY_ID } from '@core/constants';

export const statistics = {
	bySeasonId: publicProcedure
		.input(z.object({ seasonId: z.string() }))
		.query(async ({ input }) => {
			try {
				const stats = await getSeasonStatistics(input.seasonId);
				return stats;
			} catch (e) {
				if (e instanceof InputValidationError) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Invalid season ID provided.',
					});
				} else throw e;
			}
		}),
	shitPackOdds: adminProcedure
		.input(z.object({
			remainingCardCount: z.number(),
			packTypeId: z.string(),
			rarityId: z.string().optional(),
		}))
		.query(async ({ input }) => {
			const shitPackOdds = await getShitPackOdds({
				packTypeId: input.packTypeId,
				remainingCardCount: input.remainingCardCount,
				rarityIdToCheck: input.rarityId || SHIT_PACK_RARITY_ID,
			});
			return { shitPackOdds };
		}),
};

async function getShitPackOdds(args: {
	rarityIdToCheck: string;
	remainingCardCount: number;
	packTypeId: string;
}): Promise<number> {
	if (args.remainingCardCount === 0) return 1;

	const cardPool = await getPackTypeById(args).then(getCardPoolFromType);

	const remainingCardsInPool = [
		...getRemainingPossibleCardsFromCardPool(cardPool),
		...cardPool.CardInstances.filter(card => !card.openedAt),
	];

	const remainingCardsOfRarityToCheck = remainingCardsInPool.filter(card =>
		card.rarityId.startsWith(args.rarityIdToCheck)
	);
	const baselineTotalOfType = remainingCardsOfRarityToCheck[0]?.totalOfType;

	const remainingCardsInPoolWithoutLessRareCards = baselineTotalOfType
		? remainingCardsInPool.filter(card => card.totalOfType <= baselineTotalOfType)
		: remainingCardsInPool;

	let shitPackOdds = 1;

	for (let i = 0; i < args.remainingCardCount; i++) {
		shitPackOdds *=
			(remainingCardsOfRarityToCheck.length - i) /
			(remainingCardsInPoolWithoutLessRareCards.length - i);
	}

	return shitPackOdds;
}
