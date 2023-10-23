import { getAllUsers } from '@lil-indigestion-cards/core/lib/user';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
	const users = await getAllUsers();

	return new Response(JSON.stringify(users.map((user) => user.username)), {
		status: 200,
		headers: {
			'content-type': 'application/json',
		},
	});
};
