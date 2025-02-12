import { updatePackTypeName } from '@core/lib/pack-type';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
	packTypes: {
		renamePackType: defineAction({
			input: z.object({
				packTypeId: z.string(),
				packTypeName: z.string(),
			}),
			handler: async (input, context) => {
        //console.debug("Server action handler: packTypes.renamePackType")
				if (context.locals.session?.type !== 'admin') {
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'You must be an administrator to perform this action.',
					});
				}

				await updatePackTypeName(input).catch(err => {
					console.error(err);
					throw err;
				});
			},
		}),
	},
};
