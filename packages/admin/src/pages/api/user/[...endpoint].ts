import { AUTH_TOKEN } from '@admin/constants';
import type { APIRoute } from 'astro';
import { Api } from 'sst/node/api';

// Re-route all API requests to the API server
export const ALL: APIRoute = async (ctx) => {
	const route = `${Api.AdminApi.url}/user-api/${ctx.params.endpoint}${ctx.url.search}`;
	const token = ctx.cookies.get(AUTH_TOKEN);
	if (!token) return new Response('Unauthorized', { status: 401 });

	console.log('Fetching from user API: ', ctx.params.endpoint);

	return fetch(route, {
		body: ctx.request.body ?? undefined,
		method: ctx.request.method,
		headers: {
			'Content-Type': ctx.request.headers.get('Content-Type') || '',
			Authorization: `Bearer ${token.value}`,
		},
		// @ts-expect-error - This is a valid option
		duplex: "half",
	});
};
