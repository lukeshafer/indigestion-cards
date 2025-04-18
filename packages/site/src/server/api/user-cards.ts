import {
	getCardsByUserSortedByCardName,
	getCardsByUserSortedByOpenDate,
	getCardsByUserSortedByRarity,
	searchUserCards,
} from '@core/lib/card';
import { authedProcedure, publicProcedure } from '../router';
import { z } from 'astro:schema';
import { getUserAndOpenedCardInstances, getUserMomentCards, loadUserCards } from '@core/lib/user';

const userCardsInputSchema = z.object({
	username: z.string(),
	cursor: z.string().optional(),
	isReversed: z.boolean().default(false),
	ignoredIds: z.array(z.string()).optional(),
	excludeMoments: z.boolean().default(false),
});

export const userCards = {
	sortedByRarity: publicProcedure
		.input(userCardsInputSchema)
		.query(async ({ input }) => await getCardsByUserSortedByRarity(input)),
	sortedByName: publicProcedure
		.input(userCardsInputSchema)
		.query(async ({ input }) => await getCardsByUserSortedByCardName(input)),
	sortedByOpenDate: publicProcedure
		.input(userCardsInputSchema)
		.query(async ({ input }) => await getCardsByUserSortedByOpenDate(input)),
	search: publicProcedure
		.input(
			z.object({
				searchText: z.string(),
				username: z.string(),
				sortType: z.enum(['rarity', 'cardName', 'owner', 'openDate']),
				ignoredIds: z.array(z.string()).optional(),
				isReversed: z.boolean().optional(),
			})
		)
		.query(async ({ input }) => await searchUserCards(input)),
	authUserCards: authedProcedure.query(
		async ({ ctx }) =>
			(await getUserAndOpenedCardInstances({ username: ctx.session.properties.username }))
				?.CardInstances ?? []
	),
	byUsername: authedProcedure
		.input(z.object({ username: z.string() }))
		.query(
			async ({ input }) =>
				(await getUserAndOpenedCardInstances({ username: input.username }))
					?.CardInstances ?? []
		),
	moments: publicProcedure
		.input(z.object({ username: z.string() }))
		.query(async ({ input }) => await getUserMomentCards(input)),
	summary: publicProcedure
		.input(z.object({ username: z.string() }))
		.query(async ({ input }) => await loadUserCards(input.username)),
};
