import { ActionError, defineAction } from 'astro:actions';
import { array, boolean, literal, object, string } from 'astro:schema';
import { createRuleCollection, createSetCollection, deleteCollection } from '@core/lib/collections';

export const createCollection = defineAction({
	input: object({
		collectionName: string(),
	}).and(
		object({
			collectionType: literal('set'),
			collectionCards: array(string()),
		}).or(
			object({
				collectionType: literal('rule'),
				collectionRules: object({
					cardDesignIds: array(string()).optional(),
					cardNumerators: array(string()).optional(),
					seasonIds: array(string()).optional(),
					stamps: array(string()).optional(),
					tags: array(string()).optional(),
					rarityIds: array(string()).optional(),
					isMinter: boolean().optional(),
					mintedByIds: array(string()).optional(),
				}),
			})
		)
	),
	async handler(input, context) {
		let user = context.locals.user;
		if (!user) {
			throw new ActionError({ code: 'UNAUTHORIZED' });
		}

		let result;

		switch (input.collectionType) {
			case 'set': {
				result = await createSetCollection({
					collectionName: input.collectionName,
					userId: user.properties.userId,
					collectionCards: input.collectionCards,
				}).catch(
					error =>
						({
							success: false,
							message: error?.message
								? String(error.message)
								: 'An unknown error occurred.',
						}) as const
				);
				break;
			}
			case 'rule': {
				result = await createRuleCollection({
					userId: user.properties.userId,
					collectionName: input.collectionName,
					collectionRules: input.collectionRules,
				}).catch(
					error =>
						({
							success: false,
							message: error?.message
								? String(error.message)
								: 'An unknown error occurred.',
						}) as const
				);
			}
		}

		if (!result.success) {
			switch (result.message) {
				case 'USER_DOES_NOT_EXIST':
					throw new ActionError({
						code: 'BAD_REQUEST',
						message: 'This user does not exist.',
					});
				default:
					throw new ActionError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'An unknown error occurred.',
					});
			}
		}

		return { collectionId: result.data.collection.collectionId };
	},
});

export const deleteCollectionAction = defineAction({
	input: object({
		collectionId: string(),
	}),
	async handler(input, context) {
		let user = context.locals.user;
		if (!user) {
			throw new ActionError({ code: 'UNAUTHORIZED' });
		}

		const result = await deleteCollection({
			userId: user.properties.userId,
			collectionId: input.collectionId,
		}).catch(
			error =>
				({
					success: false,
					message: error?.message ? String(error.message) : 'An unknown error occurred.',
				}) as const
		);

		if (!result.success) {
			switch (result.message) {
				case 'USER_DOES_NOT_EXIST':
					throw new ActionError({
						code: 'BAD_REQUEST',
						message: 'This user does not exist.',
					});
				default:
					throw new ActionError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'An unknown error occurred.',
					});
			}
		}

		return;
	},
});
