import { AUTH_TOKEN } from '@/constants';
import type { APIRoute } from 'astro';
import { Api } from 'sst/node/api';

// Re-route all API requests to the API server
export const all: APIRoute = async (ctx) => {
	const route = `${Api.api.url}/${ctx.params.endpoint}`;
	const token = ctx.cookies.get(AUTH_TOKEN);

	console.log('Fetching from API: ', ctx.params.endpoint);

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
