import type { APIRoute } from 'astro';
import { TypedResponse, time, cacheControl } from '@/lib/api';
import { getAllUsers } from '@lib/user';

export const GET = (async () => {
	const users = (await getAllUsers()).sort((a, b) => a.username.localeCompare(b.username));

	return new TypedResponse(users, {
		headers: {
			'Cache-Control': cacheControl({
				public: true,
				maxAge: time({ minutes: 5 }),
				staleWhileRevalidate: time({ days: 1 }),
			}),
		},
	});
}) satisfies APIRoute;
