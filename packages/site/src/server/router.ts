import { TRPCError, initTRPC } from '@trpc/server';
import { z } from 'astro/zod';
import type { TRPCContext } from './context';
import { getCardsByUserSortedByCardName, getCardsByUserSortedByRarity } from '@core/lib/card';

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

export const appRouter = t.router({
	userCards: {
		sortedByRarity: publicProcedure
			.input(
				z.object({
					username: z.string(),
					cursor: z.string().optional(),
					isReversed: z.boolean().default(false),
					filter: z.string().optional(),
				})
			)
			.query(async ({ input }) => await getCardsByUserSortedByRarity(input)),
		sortedByName: publicProcedure
			.input(
				z.object({
					username: z.string(),
					cursor: z.string().optional(),
					isReversed: z.boolean().default(false),
					filter: z.string().optional(),
				})
			)
			.query(async ({ input }) => await getCardsByUserSortedByCardName(input)),
	},
});

export type AppRouter = typeof appRouter
