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
	getPackById,
	getPacksByUsername,
	hidePackCards,
	updatePackUser,
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
		give: authedProcedure
			.input(
				z.object({
					packId: z.string(),
					username: z.string(),
					userId: z.string(),
				})
			)
			.mutation(async ({ input, ctx }) => {
				const gifter = ctx.session.properties;

				const pack = await getPackById({ packId: input.packId })
					.then(pack => pack || undefined)
					.catch(() => undefined);

				if (!pack?.userId || pack.userId !== gifter.userId) {
					throw new TRPCError({
						code: 'UNAUTHORIZED',
						message: 'You do not own this pack.',
					});
				}

				try {
					await updatePackUser({
						packId: input.packId,
						userId: input.userId,
						username: input.username,
					});
				} catch (error) {
					console.error('An error occurred while updating the pack user.', { error });
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message:
							'An error occurred while gifting the pack. Please try again or contact an administrator if the error persists.',
					});
				}
			}),
	},
});

export type AppRouter = typeof appRouter;
export type UserCardsInput = z.infer<typeof userCardsInputSchema>;
