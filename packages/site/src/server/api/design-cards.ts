import { z } from 'astro:schema';
import { publicProcedure } from '../router';
import {
	getCardsByDesignSortedByOpenDate,
	getCardsByDesignSortedByOwnerName,
	getCardsByDesignSortedByRarity,
	searchDesignCards,
} from '@core/lib/card';

const designCardsInputSchema = z.object({
	designId: z.string(),
	cursor: z.string().optional(),
	isReversed: z.boolean().default(false),
});

export const designCards = {
	sortedByRarity: publicProcedure
		.input(designCardsInputSchema)
		.query(async ({ input }) => await getCardsByDesignSortedByRarity(input)),
	sortedByOpenDate: publicProcedure
		.input(designCardsInputSchema)
		.query(async ({ input }) => await getCardsByDesignSortedByOpenDate(input)),
	sortedByOwner: publicProcedure
		.input(designCardsInputSchema)
		.query(async ({ input }) => await getCardsByDesignSortedByOwnerName(input)),
	search: publicProcedure
		.input(
			z.object({
				searchText: z.string(),
				designId: z.string(),
				sortType: z.enum(['rarity', 'cardName', 'owner', 'openDate']),
				isReversed: z.boolean().optional(),
			})
		)
		.query(async ({ input }) => await searchDesignCards(input)),
};
