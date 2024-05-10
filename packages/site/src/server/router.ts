import { TRPCError, initTRPC } from '@trpc/server';
import { z } from 'astro/zod';
import type { TRPCContext } from './context';
import {
	getCardsByUserSortedByCardName,
	getCardsByUserSortedByRarity,
	searchUserCards,
} from '@core/lib/card';

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

const userCardsInputSchema = z.object({
	username: z.string(),
	cursor: z.string().optional(),
	isReversed: z.boolean().default(false),
	filter: z.string().optional(),
	ignoredIds: z.array(z.string()).optional(),
});

export const appRouter = t.router({
	userCards: {
		sortedByRarity: publicProcedure
			.input(userCardsInputSchema)
			.query(async ({ input }) => await getCardsByUserSortedByRarity(input)),
		sortedByName: publicProcedure
			.input(userCardsInputSchema)
			.query(async ({ input }) => await getCardsByUserSortedByCardName(input)),
		search: publicProcedure
			.input(
				z.object({
					searchText: z.string(),
					username: z.string(),
					sortType: z.enum(['rarity', 'cardName']),
					ignoredIds: z.array(z.string()).optional(),
					isReversed: z.boolean().optional(),
				})
			)
			.query(async ({ input }) => await searchUserCards(input)),
	},
});

export type AppRouter = typeof appRouter;
export type UserCardsInput = z.infer<typeof userCardsInputSchema>;
