import { z } from 'astro/zod';
import { router, publicProcedure, adminProcedure, userProcedure } from './core';
import { getAllPacks, getPackCount, getPacksRemaining } from '@lil-indigestion-cards/core/lib/pack';
import { getRarityRanking, getSiteConfig } from '@lil-indigestion-cards/core/lib/site-config';
import {
	getAllUsersSortedByName,
	getUserByUserName,
	getUserAndOpenedCardInstances,
} from '@lil-indigestion-cards/core/lib/user';
import { getUserByLogin } from '@lil-indigestion-cards/core/lib/twitch';
import {
	getAllCardDesigns,
	getCardDesignAndOpenedInstances,
} from '@lil-indigestion-cards/core/lib/design';
import { getAllPreorders } from '@lil-indigestion-cards/core/lib/preorder';
import { getTrade } from '@lil-indigestion-cards/core/lib/trades';

export const appRouter = router({
	users: router({
		all: publicProcedure.query(getAllUsersSortedByName),
		allUsernames: publicProcedure.query(async () =>
			getAllUsersSortedByName().then(users => users.map(user => user.username))
		),
		byUsername: publicProcedure
			.input(z.object({ username: z.string() }))
			.query(async ({ input }) => getUserByUserName(input.username)),
		byUsernameWithCards: publicProcedure
			.input(z.object({ username: z.string() }))
			.query(async ({ input }) => getUserAndOpenedCardInstances(input)),
	}),

	trades: router({
		byId: publicProcedure
			.input(z.object({ tradeId: z.string() }))
			.query(async ({ input }) => getTrade(input.tradeId)),
	}),

	designs: router({
		all: publicProcedure.query(getAllCardDesigns),
		byIdWithInstances: publicProcedure
			.input(z.object({ designId: z.string() }))
			.query(async ({ input }) => getCardDesignAndOpenedInstances(input)),
	}),

	packs: router({
		remaining: publicProcedure.query(getPacksRemaining),
		all: adminProcedure.query(getAllPacks),
		count: adminProcedure.query(getPackCount),
	}),

	preorders: router({
		all: publicProcedure.query(getAllPreorders),
	}),

	siteConfig: publicProcedure.query(async () => {
		console.log('getting site config');
		return getSiteConfig();
	}),
	rarityRanking: publicProcedure.query(async () => getRarityRanking()),

	twitch: router({
		userByLogin: publicProcedure
			.input(z.object({ login: z.string() }))
			.query(async ({ input }) => getUserByLogin(input.login)),
	}),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
