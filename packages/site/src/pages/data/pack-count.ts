import type { APIRoute } from 'astro';
import { TypedResponse, time, cacheControl } from '@/lib/api';
import { getAllPacks } from '@lib/pack';

export const GET = (async () => {
	const packs = await getAllPacks();
	const packCount = packs.length;

	return new TypedResponse(
		{ packCount },
		{
			headers: {
				'Cache-Control': cacheControl({
					public: true,
					maxAge: time({ minutes: 15 }),
					staleWhileRevalidate: time({ days: 1 }),
				}),
			},
		}
	);
}) satisfies APIRoute;
