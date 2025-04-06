import { z } from 'astro:schema';
import { publicProcedure } from '../router';
import { getSeasonStatistics } from '@core/lib/stats';
import { InputValidationError } from '@core/lib/errors';
import { TRPCError } from '@trpc/server';

export const statistics = {
	bySeasonId: publicProcedure
		.input(z.object({ seasonId: z.string() }))
		.query(async ({ input }) => {
			try {
				const stats = await getSeasonStatistics(input.seasonId);
				return stats;
			} catch (e) {
				if (e instanceof InputValidationError) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Invalid season ID provided.',
					});
				} else throw e;
			}
		}),
};
