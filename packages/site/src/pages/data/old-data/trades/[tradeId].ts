import type { APIRoute } from 'astro';
import { TypedResponse } from '@/lib/api';
import { getTrade } from '@lil-indigestion-cards/core/lib/trades';

export const GET = (async (ctx) => {
	const { tradeId } = ctx.params;
	if (!tradeId) throw new Error('No tradeId provided');

	const trade = await getTrade(tradeId);

	return new TypedResponse(trade);
}) satisfies APIRoute;
