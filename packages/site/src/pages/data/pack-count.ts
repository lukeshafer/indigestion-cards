import type { APIRoute } from 'astro';
import { TypedResponse } from '@site/lib/api';
import { getAllPacks } from '@core/lib/pack';

export const GET = (async () => {
	const packs = await getAllPacks();
	const packCount = packs.length;

	return new TypedResponse({ packCount });
}) satisfies APIRoute;
