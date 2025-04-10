import { sendGivePackEvents } from '@core/lib/pack';
import { getPackTypeById, updatePackTypeName } from '@core/lib/pack-type';
import { getUserByLogin } from '@core/lib/twitch';
import { addCardDesignTag, removeCardDesignTag } from '@core/lib/design';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
	packs: {
		batchGivePacks: defineAction({
			input: z.object({
				usernames: z.array(z.string()),
				packTypeId: z.string(),
			}),
			handler: async (input, context) => {
				if (context.locals.session?.type !== 'admin') {
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'You must be an administrator to perform this action.',
					});
				}

				const packType = await getPackTypeById({ packTypeId: input.packTypeId });

				let invalidUsers = [];
				let events: Parameters<typeof sendGivePackEvents>[0] = [];
				for (let username of input.usernames) {
					const user = await getUserByLogin(username.toLowerCase()).catch(
						() => undefined
					);
					if (user === undefined) {
						invalidUsers.push(username);
						continue;
					}

					events.push({
						event: { eventType: 'admin-site' as const },
						userId: user.id,
						username: user.login,
						packType,
					});
				}

				if (events.length > 0) {
					await sendGivePackEvents(events);
				}

				return {
					successful: events.map(u => u.username),
					invalidUsers,
				};
			},
		}),
	},
	designs: {
		addTag: defineAction({
			input: z.object({
				designId: z.string(),
				tags: z.array(z.string()),
			}),
			handler: async (input, context) => {
				if (context.locals.session?.type !== 'admin') {
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'You must be an administrator to perform this action.',
					});
				}

				const result = await addCardDesignTag({
					designId: input.designId,
					tags: input.tags,
				});

				if (!result.success) {
					throw new ActionError({ code: 'INTERNAL_SERVER_ERROR' });
				}

				return;
			},
		}),
		removeTag: defineAction({
			input: z.object({
				designId: z.string(),
				tag: z.string(),
			}),
			handler: async (input, context) => {
				if (context.locals.session?.type !== 'admin') {
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'You must be an administrator to perform this action.',
					});
				}

				const result = await removeCardDesignTag({
					designId: input.designId,
					tag: input.tag,
				});

				if (!result.success) {
					throw new ActionError({ code: 'INTERNAL_SERVER_ERROR' });
				}

				return;
			},
		}),
	},
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
