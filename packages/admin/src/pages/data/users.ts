import type { APIRoute } from 'astro';
import { TypedResponse, } from '@admin/lib/api';
import { getAllUsers } from '@core/lib/user';

export const GET = (async () => {
	const users = (await getAllUsers()).sort((a, b) => a.username.localeCompare(b.username));
	return new TypedResponse(users);
}) satisfies APIRoute;
