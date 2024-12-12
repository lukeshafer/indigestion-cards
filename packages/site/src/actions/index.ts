import { getPackById, setPackIsLocked } from '@core/lib/pack';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
	packs: {
		setIsLocked: defineAction({
			input: z.object({
				packId: z.string(),
				isLocked: z.boolean(),
			}),
			handler: async (input, context) => {
				if (
					context.locals.session?.type !== 'admin' &&
					context.locals.session?.type !== 'user'
				) {
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'You must be a user to perform this action.',
					});
				}

				const pack = await getPackById({ packId: input.packId });

				if (!pack.userId || pack.userId !== context.locals.session.properties.userId) {
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'You must own the pack to perform this action.',
					});
				}

				await setPackIsLocked({
					isLocked: input.isLocked,
					packId: input.packId,
				}).catch(err => {
					console.error(err);
					throw err;
				});
			},
		}),
	},
};
