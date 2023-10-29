import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { getUserAndCardInstances } from '@lil-indigestion-cards/core/lib/user';

export const cards = router({
	byUserId: publicProcedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
		const cards = await getUserAndCardInstances({ username: input.username });
		return cards?.cardInstances ?? [];
	}),
});
