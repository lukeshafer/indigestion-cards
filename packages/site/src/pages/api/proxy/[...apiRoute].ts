import { AUTH_TOKEN } from '@/constants';
import { useAdmin } from '@/session';
import type { APIRoute } from 'astro';
import { Api } from 'sst/node/api';

export const all: APIRoute = async (ctx) => {
	let body: string | null = null;
	if (ctx.request.method === 'POST') {
		body = await ctx.request.text();
	}
	const apiRoute = ctx.params.apiRoute;
	if (!apiRoute) {
		return ctx.redirect('/404');
	}
	const query = ctx.url.search;

	const session = useAdmin(ctx.cookies);
	const token = ctx.cookies.get(AUTH_TOKEN);
	if (!token || !session) {
		return new Response('Unauthorized', { status: 401 });
	}

	return fetch(`${Api.api.url}/${apiRoute}${query}`, {
		method: ctx.request.method,
		headers: {
			...ctx.request.headers,
			authorization: `Bearer ${ctx.cookies.get(AUTH_TOKEN).value ?? ''}`,
		},
		body: body,
	});
};
