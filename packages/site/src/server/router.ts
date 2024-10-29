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
import {
	getAllPacks,
	getPacksByUsername,
	hidePackCards,
} from '@core/lib/pack';

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
});

export type AppRouter = typeof appRouter;
export type UserCardsInput = z.infer<typeof userCardsInputSchema>;
