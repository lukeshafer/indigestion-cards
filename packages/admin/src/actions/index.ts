import { sendGivePackEvents } from '@core/lib/pack';
import { getPackTypeById, updatePackTypeName } from '@core/lib/pack-type';
import { getUserByLogin } from '@core/lib/twitch';
import { addCardDesignTag, removeCardDesignTag, setCardDesignGame } from '@core/lib/design';
import { ActionError, defineAction, type ActionAPIContext } from 'astro:actions';
import { z } from 'astro/zod';
import type { Session } from '@core/types';
import { createAdminUser, deleteAdminUser } from '@core/lib/admin-user';

export const server = {
	packs: {
		batchGivePacks: defineAction({
			input: z.object({
				usernames: z.array(z.string()),
				packTypeId: z.string(),
			}),
			handler: async (input, context) => {
				adminOnly(context);

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
				adminOnly(context);

				const result = await addCardDesignTag({
					designId: input.designId,
					tags: input.tags,
				}).catch(e => ({
					success: false,
					error: e,
				}));

				if (!result.success) {
					console.error(result.error);
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
				adminOnly(context);

				const result = await removeCardDesignTag({
					designId: input.designId,
					tag: input.tag,
				}).catch(e => ({
					success: false,
					error: e,
				}));

				if (!result.success) {
					console.error(result.error);
					throw new ActionError({ code: 'INTERNAL_SERVER_ERROR' });
				}

				return;
			},
		}),
		setGame: defineAction({
			input: z.object({
				designId: z.string(),
				game: z.string(),
			}),
			handler: async (input, context) => {
				adminOnly(context);

				const result = await setCardDesignGame({
					designId: input.designId,
					game: input.game,
				}).catch(e => ({
					success: false,
					error: e,
				}));

				if (!result.success) {
					console.error(result.error);
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
				adminOnly(context);

				await updatePackTypeName(input).catch(err => {
					console.error(err);
					throw err;
				});
			},
		}),
	},
	adminUsers: {
		create: defineAction({
			input: z.object({ username: z.string() }),
			handler: async ({ username }, ctx) => {
				adminOnly(ctx);
				const user = await getUserByLogin(username);
				if (!user)
					throw new ActionError({
						code: 'NOT_FOUND',
						message: `User ${username} is not a valid Twitch user}`,
					});

				const result = await createAdminUser({
					userId: user.id,
					username: user.display_name,
				});

				if (!result.success) {
					throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
				}

				return;
			},
		}),
		deleteUser: defineAction({
			input: z.object({ userId: z.string(), username: z.string(), isStreamer: z.boolean() }),
			handler: async (input, ctx) => {
				adminOnly(ctx);
				console.log(`Deleting user ${input.username} (${input.userId})`);
				const result = await deleteAdminUser(input);

				if (!result.success) {
					throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
				}

				return;
			},
		}),
	},
};

function adminOnly(context: ActionAPIContext) {
	if (context.locals.session?.type !== 'admin') {
		throw new ActionError({
			code: 'UNAUTHORIZED',
			message: 'You must be an administrator to perform this action.',
		});
	}
}
