import type { APIRoute } from 'astro';
import { TypedResponse, time, cacheControl } from '@/lib/api';
import { getAllUsers } from '@lib/user';

export const GET = (async () => {
	const users = (await getAllUsers())
		.map((user) => user.username)
		.sort((a, b) => a.localeCompare(b));

	return new TypedResponse(users, {
		headers: {
			'Cache-Control': cacheControl({
				public: true,
				maxAge: time({ minutes: 15 }),
				staleWhileRevalidate: time({ days: 1 }),
			}),
		},
	});
}) satisfies APIRoute;
