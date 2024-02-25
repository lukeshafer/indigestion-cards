import type { APIRoute } from 'astro';
import { TypedResponse, } from '@/lib/api';
import { getAllUsers } from '@lib/user';

export const GET = (async () => {
	const users = (await getAllUsers())
		.map((user) => user.username)
		.sort((a, b) => a.localeCompare(b));

	return new TypedResponse(users);
}) satisfies APIRoute;
