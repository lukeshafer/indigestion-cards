import { TRPCError, initTRPC } from '@trpc/server';
import { z } from 'astro/zod';
import type { TRPCContext } from './context';
import {
	getCardsByDesignSortedByOpenDate,
	getCardsByDesignSortedByOwnerName,
	getCardsByDesignSortedByRarity,
	getCardsByUserSortedByCardName,
	getCardsByUserSortedByOpenDate,
	getCardsByUserSortedByRarity,
	searchDesignCards,
	searchUserCards,
} from '@core/lib/card';
import { getAllPacks, getPacksByUsername, hidePackCards } from '@core/lib/pack';
import { getAllUsers } from '@core/lib/user';
import {
	getCollectionCards,
	getRuleCollectionCards,
	getSetCollectionCards,
} from '@core/lib/collections';

const t = initTRPC.context<TRPCContext>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(args => {
	const session = args.ctx.session;

	if (session?.type !== 'user' && session?.type !== 'admin') {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	return args.next({ ctx: { session } });
});
export const adminProcedure = t.procedure.use(args => {
	const session = args.ctx.session;

	if (session?.type !== 'admin') {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	return args.next({ ctx: { session } });
});

const userCardsInputSchema = z.object({
	username: z.string(),
	cursor: z.string().optional(),
	isReversed: z.boolean().default(false),
	ignoredIds: z.array(z.string()).optional(),
});

const designCardsInputSchema = z.object({
	designId: z.string(),
	cursor: z.string().optional(),
	isReversed: z.boolean().default(false),
});

export const appRouter = t.router({
	users: {
		allUsernames: publicProcedure.query(async () =>
			(await getAllUsers()).map(user => user.username).sort((a, b) => a.localeCompare(b))
		),
	},
	userCards: {
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
	},
	designCards: {
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
	},
	packs: {
		all: adminProcedure.query(async () => await getAllPacks()),
		byUser: authedProcedure
			.input(z.object({ username: z.string() }))
			.query(
				async ({ input }) =>
					await getPacksByUsername({ username: input.username }).then(packs =>
						packs.map(hidePackCards)
					)
			),
	},
	collections: {
		cards: authedProcedure.input(z.object({ collectionId: z.string() })).query(
			async ({ input, ctx }) =>
				await getCollectionCards({
					userId: ctx.session.properties.userId,
					collectionId: input.collectionId,
				})
		),
		mockLoadCardsSet: adminProcedure
			.input(
				z.object({
					cards: z.array(z.string()),
				})
			)
			.query(async ({ input, ctx }) => {
				const data = await getSetCollectionCards({
					username: ctx.session.properties.username,
					cards: input.cards,
				});

				return { cards: data };
			}),
		mockLoadCardsRule: adminProcedure
			.input(
				z.object({
					cardDesignIds: z.array(z.string()).optional(),
					cardNumerators: z.array(z.string()).optional(),
					seasonIds: z.array(z.string()).optional(),
					stamps: z.array(z.string()).optional(),
					tags: z.array(z.string()).optional(),
					rarityIds: z.array(z.string()).optional(),
					isMinter: z.boolean().optional(),
					mintedByIds: z.array(z.string()).optional(),
				})
			)
			.query(async ({ input, ctx }) => {
				const data = await getRuleCollectionCards({
					username: ctx.session.properties.username,
					userId: ctx.session.properties.userId,
					rules: input,
				});

				return { cards: data };
			}),
	},
});

export type AppRouter = typeof appRouter;
export type UserCardsInput = z.infer<typeof userCardsInputSchema>;
