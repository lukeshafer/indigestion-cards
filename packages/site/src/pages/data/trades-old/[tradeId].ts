import { createLoader } from '@/lib/api';
import { getTrade } from '@lil-indigestion-cards/core/lib/trades';
import { z } from 'astro/zod';

export const { GET, load } = createLoader(
	z.object({
		tradeId: z.string(),
	}),
	async ({ tradeId }) => {
		if (!tradeId) throw new Error('No tradeId provided');
		const trade = await getTrade(tradeId);
		return trade;
	}
);
