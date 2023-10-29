import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { getAllTradesForUser } from '@lil-indigestion-cards/core/lib/trades';

export const trades = router({
	byUserId: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
		const trades = await getAllTradesForUser(input.userId);
		return trades;
	}),
});
