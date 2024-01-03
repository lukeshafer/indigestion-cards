import { getAllPacks } from '@lil-indigestion-cards/core/lib/pack';
import { router, publicProcedure, adminProcedure, userProcedure } from './trpc';

import { getSiteConfig } from '@lil-indigestion-cards/core/lib/site-config';
import { getUserByUserName } from '@lil-indigestion-cards/core/lib/user';
import { z } from 'astro/zod';
import { getUserByLogin } from '@lil-indigestion-cards/core/lib/twitch';

export const appRouter = router({
	siteConfig: publicProcedure.query(async () => getSiteConfig()),
	users: router({
		byUsername: publicProcedure
			.input(z.object({ username: z.string() }))
			.query(async ({ input }) => getUserByUserName(input.username)),
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
