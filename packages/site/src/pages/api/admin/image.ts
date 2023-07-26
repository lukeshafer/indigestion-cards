import type { APIRoute } from 'astro';
import { AUTH_TOKEN, routes } from '@/constants';
import { Api } from 'sst/node/api';
import {
	createRarity,
	deleteUnmatchedDesignImage,
	deleteRarityById,
} from '@lil-indigestion-cards/core/card';

export const del: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const key = params.get('key');
	const type = params.get('type');

	if (!key) return new Response('Missing key', { status: 400 });
	if (!type) return new Response('Missing type', { status: 400 });
	else if (!['frame', 'cardDesign'].includes(type))
		return new Response('Invalid type', { status: 400 });

	const result = await fetch(Api.api.url + '/delete-unmatched-image', {
		method: 'DELETE',
		headers: {
			authorization: `Bearer ${ctx.cookies.get(AUTH_TOKEN).value ?? ''}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			key,
			type,
		}),
	});

	if (!result.ok) return new Response('Failed to delete image', { status: 500 });

	return ctx.redirect(
		`${type === 'frame' ? routes.RARITIES : routes.DESIGNS}?alert=Draft%20deleted!&type=success`
	);
};
