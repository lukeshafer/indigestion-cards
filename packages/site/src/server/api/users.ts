import { z } from 'astro:schema';
import { authedProcedure, publicProcedure } from '../router';
import { getAllUsers, getUserByUserName, searchUsers, setUserProfile } from '@core/lib/user';

export const users = {
	allUsernames: publicProcedure.query(async () =>
		(await getAllUsers()).map(user => user.username).sort((a, b) => a.localeCompare(b))
	),
	search: publicProcedure
		.input(z.object({ searchString: z.string().min(1) }))
		.query(async ({ input }) => await searchUsers(input)),
	byUsername: publicProcedure
		.input(z.object({ username: z.string() }))
		.query(async ({ input }) => await getUserByUserName(input.username)),
	update: authedProcedure
		.input(
			z.object({
				lookingFor: z.string().optional(),
				pinnedCardId: z.string().nullable().optional(),
				pinnedCardDesignId: z.string().nullable().optional(),
				minecraftUsername: z.string().optional(),
			})
		)
		.mutation(
			async ({ input, ctx }) =>
				await setUserProfile({
					userId: ctx.session.properties.userId,
					lookingFor: input.lookingFor,
					minecraftUsername: input.minecraftUsername?.toLowerCase(),
					pinnedCard:
						input.pinnedCardId === null || input.pinnedCardDesignId === null
							? null
							: input.pinnedCardId && input.pinnedCardDesignId
								? {
										designId: input.pinnedCardDesignId,
										instanceId: input.pinnedCardId,
									}
								: undefined,
				})
		),
};
