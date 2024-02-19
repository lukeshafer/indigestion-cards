import { getAllPacks } from '@lil-indigestion-cards/core/lib/pack';
import { router, publicProcedure, adminProcedure, userProcedure } from './trpc';

import { getRarityRanking, getSiteConfig } from '@lil-indigestion-cards/core/lib/site-config';
import { getUserByUserName } from '@lil-indigestion-cards/core/lib/user';
import { z } from 'astro/zod';
import { getUserByLogin } from '@lil-indigestion-cards/core/lib/twitch';
import {
	getAllCardDesigns,
	getCardDesignAndInstancesById,
} from '@lil-indigestion-cards/core/lib/design';

export const appRouter = router({
	siteConfig: publicProcedure.query(async () => getSiteConfig()),
  rarityRanking: publicProcedure.query(async () => getRarityRanking()),
	users: router({
		byUsername: publicProcedure
			.input(z.object({ username: z.string() }))
			.query(async ({ input }) => getUserByUserName(input.username)),
	}),
	cardDesigns: router({
		getAll: publicProcedure.query(getAllCardDesigns),
		byId: publicProcedure.input(z.object({ designId: z.string() })).query(async ({ input }) => {
			const {
				cardDesigns: [design],
				cardInstances,
			} = await getCardDesignAndInstancesById(input);

			return { design, instances: cardInstances.filter(instance => instance.openedAt) };
		}),
	}),
	packs: router({
		count: adminProcedure.query(async () => getAllPacks().then(p => p.length)),
	}),
	twitch: router({
		userByLogin: userProcedure
			.input(z.object({ login: z.string() }))
			.query(async ({ input }) => getUserByLogin(input.login)),
	}),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
