import type { APIRoute } from 'astro';
import {
	createPackForNoUser,
	givePackToUser,
	packSchema,
	packSchemaWithoutUser,
	updatePackUser,
} from '@lil-indigestion-cards/core/pack';
import { deleteFirstPackForUser } from '@lil-indigestion-cards/core/card';
import { getUserByLogin } from '@lil-indigestion-cards/core/twitch-helpers';
import { getUserByUserName } from '@lil-indigestion-cards/core/user';
import { getPackById } from '@lil-indigestion-cards/core/card';

export const post: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const username = params.get('username');
	const rawCount = params.get('count');
	const paramUserId = params.get('userId');
	const packTypeString = params.get('packType');

	if (!packTypeString) {
		return new Response('Missing pack type', { status: 400 });
	}
	const userId = username ? paramUserId ?? (await getUserByLogin(username))?.id ?? null : null;

	const packCount = rawCount ? parseInt(rawCount, 10) : 1;

	try {
		const packType = JSON.parse(packTypeString);

		if (!username || !userId) {
			const parseResult = packSchemaWithoutUser.safeParse({ packCount, packType });
			if (!parseResult.success) {
				return new Response(parseResult.error.message, { status: 400 });
			}
			await createPackForNoUser(parseResult.data);
		} else {
			const parseResult = packSchema.safeParse({ userId, username, packCount, packType });
			if (!parseResult.success) {
				return new Response(parseResult.error.message, { status: 400 });
			}
			await givePackToUser(parseResult.data);
		}
		return new Response(username ? `Pack given to ${username}` : `Pack created`, {
			status: 200,
		});
	} catch (error) {
		console.error(error);
		if (error instanceof Error) {
			return new Response(error.message, { status: 400 });
		}
		return new Response('Unknown error', { status: 400 });
	}
};

export const patch: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const packId = params.get('packId');
	const username = params.get('username');

	if (!packId) return new Response('Missing pack ID', { status: 400 });
	if (!username) return new Response('Missing username', { status: 400 });

	const pack = await getPackById({ packId });

	if (!pack) return new Response('Pack not found', { status: 404 });

	const userId =
		(await getUserByUserName(username))?.userId ?? (await getUserByLogin(username))?.id;

	if (!userId) return new Response('User not found', { status: 404 });

	if (pack.username !== username) {
		await updatePackUser({ packId, userId, username });
		return new Response("Updated pack's user", { status: 200 });
	}

	return new Response('Pack already has that user', { status: 200 });
};

export const del: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const userId = params.get('userId');
	const username = params.get('username');

	if (!userId) return new Response('Missing user ID', { status: 400 });
	if (!username) return new Response('Missing username', { status: 400 });

	const result = await deleteFirstPackForUser({ userId, username });
	if (!result.success) return new Response(result.error, { status: 400 });

	return new Response(`Deleted 1 pack for ${username}`, { status: 200 });
};
