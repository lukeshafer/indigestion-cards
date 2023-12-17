import type { APIRoute } from 'astro';
import { TypedResponse } from '@/lib/api';
import { getUserByUserName } from '@lil-indigestion-cards/core/lib/user';

export const GET = (async (ctx) => {
	const { username } = ctx.params;
	if (!username) throw new Error('No username provided');

	const user = await getUserByUserName(username)

	return new TypedResponse(user);
}) satisfies APIRoute;
