import type { APIRoute } from 'astro';
import { deleteAdminUser } from '@lil-indigestion-cards/core/user';

export const del: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const userId = params.get('userId');
	const username = params.get('username');
	const isStreamerStr = params.get('isStreamer');

	if (!userId || !username || !isStreamerStr) {
		return new Response('Missing parameters', { status: 400 });
	}

	const isStreamer = isStreamerStr === 'true';

	console.log(`Deleting user ${username} (${userId})`);

	const result = await deleteAdminUser({ userId, username, isStreamer });

	if (!result.success)
		return new Response('An error occurred while deleting the user.', { status: 500 });

	return new Response(`Successfully deleted user ${username} (${userId})`, { status: 200 });
};
