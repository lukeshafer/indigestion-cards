import { z } from 'astro:schema';
import { authedProcedure } from '../router';
import {
	createRuleCollection,
	createSetCollection,
	deleteCollection,
	getCollectionCards,
	getRuleCollectionCards,
	getSetCollectionCards,
} from '@core/lib/collections';
import { TRPCError } from '@trpc/server';

export const collections = {
	cards: authedProcedure.input(z.object({ collectionId: z.string() })).query(
		async ({ input, ctx }) =>
			await getCollectionCards({
				userId: ctx.session.properties.userId,
				collectionId: input.collectionId,
			})
	),
	mockLoadCardsSet: authedProcedure
		.input(
			z.object({
				cards: z.array(
					z.object({
						designId: z.string(),
						instanceId: z.string(),
					})
				),
			})
		)
		.query(async ({ input, ctx }) => {
			const data = await getSetCollectionCards({
				userId: ctx.session.properties.userId,
				cards: input.cards,
			});

			return data;
		}),
	mockLoadCardsRule: authedProcedure
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

			return data;
		}),
	create: authedProcedure
		.input(
			z.object({ collectionName: z.string() }).and(
				z
					.object({
						collectionType: z.literal('set'),
						collectionCards: z.array(
							z.object({ designId: z.string(), instanceId: z.string() })
						),
					})
					.or(
						z.object({
							collectionType: z.literal('rule'),
							collectionRules: z.object({
								cardDesignIds: z.array(z.string()).optional(),
								cardNumerators: z.array(z.string()).optional(),
								seasonIds: z.array(z.string()).optional(),
								stamps: z.array(z.string()).optional(),
								tags: z.array(z.string()).optional(),
								rarityIds: z.array(z.string()).optional(),
								isMinter: z.boolean().optional(),
								mintedByIds: z.array(z.string()).optional(),
							}),
						})
					)
			)
		)
		.mutation(async ({ input, ctx }) => {
			console.log('Attempting to create collection');

			let result;

			switch (input.collectionType) {
				case 'set': {
					result = await createSetCollection({
						collectionName: input.collectionName,
						userId: ctx.session.properties.userId,
						collectionCards: input.collectionCards,
					}).catch(error => {
						console.error(error);
						return {
							success: false,
							message: error?.message
								? String(error.message)
								: 'An unknown error occurred.',
						} as const;
					});
					break;
				}
				case 'rule': {
					result = await createRuleCollection({
						userId: ctx.session.properties.userId,
						collectionName: input.collectionName,
						collectionRules: input.collectionRules,
					}).catch(error => {
						console.error(error);
						return {
							success: false,
							message: error?.message
								? String(error.message)
								: 'An unknown error occurred.',
						} as const;
					});
				}
			}

			if (!result.success) {
				switch (result.message) {
					case 'USER_DOES_NOT_EXIST':
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: 'This user does not exist.',
						});
					default:
						throw new TRPCError({
							code: 'INTERNAL_SERVER_ERROR',
							message: 'An unknown error occurred.',
						});
				}
			}

			return {
				collectionId: result.data.collection?.collectionId,
				username: ctx.session.properties.username,
			};
		}),
	delete: authedProcedure
		.input(z.object({ collectionId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const result = await deleteCollection({
				userId: ctx.session.properties.userId,
				collectionId: input.collectionId,
			}).catch(
				error =>
					({
						success: false,
						message: error?.message
							? String(error.message)
							: 'An unknown error occurred.',
					}) as const
			);

			if (!result.success) {
				switch (result.message) {
					case 'USER_DOES_NOT_EXIST':
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: 'This user does not exist.',
						});
					default:
						throw new TRPCError({
							code: 'INTERNAL_SERVER_ERROR',
							message: 'An unknown error occurred.',
						});
				}
			}

			return;
		}),
};
