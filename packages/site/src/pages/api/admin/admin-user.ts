import type { APIRoute } from 'astro';
import {
	deleteAdminUser,
	getAllAdminUsers,
	createAdminUser,
} from '@lil-indigestion-cards/core/user';
import { getUserByLogin } from '@lil-indigestion-cards/core/twitch-helpers';

export const get: APIRoute = async (ctx) => {
	const users = await getAllAdminUsers();

	return new Response(
		JSON.stringify(
			users.map((user) => ({
				username: user.username,
				userId: user.userId,
				isStreamer: user.isStreamer,
			}))
		),
		{ status: 200 }
	);
};

export const post: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const username = params.get('username');
	if (!username) {
		return new Response('Missing username', { status: 400 });
	}

	const user = await getUserByLogin(username);
	if (!user) {
		return new Response('Twitch user not found', { status: 404 });
	}

	const { display_name, id } = user;
	const result = await createAdminUser({ userId: id, username: display_name });

	if (!result.success)
		return new Response('An error occurred while creating the user.', { status: 500 });

	return new Response(`Successfully created user ${display_name} (ID: ${id})`, { status: 200 });
};

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

	return new Response(`Successfully deleted user ${username} (ID: ${userId})`, { status: 200 });
};
