import { server } from '@/data/data.server';
import type { APIRoute } from 'astro';

export const GET = (async ctx => {
	const path = ctx.url.pathname.split('/');
	const type = path[2];

	if (!(type in server.data)) {
		return new Response(null, { status: 404 });
	}

	const loader = server.data[type as keyof typeof server.data];
	return loader.GET(ctx);
}) satisfies APIRoute;
