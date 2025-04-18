import { AUTH_TOKEN } from '@site/constants';
import type { APIRoute } from 'astro';
import { Resource } from 'sst';

// Re-route all API requests to the API server
export const ALL: APIRoute = async ctx => {
	const route = `${Resource.AdminApi.url}/${ctx.params.endpoint}${ctx.url.search}`;
	const token = ctx.cookies.get(AUTH_TOKEN);

	console.log('Fetching from /api/admin: ', ctx.params.endpoint);

	const res = await fetch(route, {
		body: ctx.request.body ?? undefined,
		method: ctx.request.method,
		headers: {
			'Content-Type': ctx.request.headers.get('Content-Type') || '',
			Authorization: `Bearer ${token?.value}`,
		},
		// @ts-expect-error - This is a valid option
		duplex: 'half',
	});

	return res;
};
