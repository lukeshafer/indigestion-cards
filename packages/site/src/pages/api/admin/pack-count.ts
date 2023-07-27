import type { APIRoute } from 'astro';
import { getUser } from '@lil-indigestion-cards/core/user';
import { getAllPacks } from '@lil-indigestion-cards/core/card';

export const get: APIRoute = async (ctx) => {
	const userId = ctx.url.searchParams.get('userId');

	if (userId) {
		const user = await getUser(userId);
		const packCount = user?.packCount ?? 0;
		return new Response(JSON.stringify({ packCount }), { status: 200 });
	}

	const packs = await getAllPacks();
	const packCount = packs.length;
	return new Response(JSON.stringify({ packCount }), { status: 200 });
};
