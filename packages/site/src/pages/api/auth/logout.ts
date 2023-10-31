import type { APIRoute } from 'astro';
import { AUTH_TOKEN } from '@/constants';

export const POST: APIRoute = async (ctx) => {
	console.log('Logout request ', {
		headers: Object.fromEntries([...ctx.request.headers.entries()]),
		cookies: ctx.cookies,
	});

	if (ctx.request.headers.get('purpose') === 'prefetch') {
		return new Response(null, { status: 204 });
	}

	ctx.cookies.delete(AUTH_TOKEN, { path: '/' });

	return ctx.redirect('/?alert=Logged%20out!', 302);
};
