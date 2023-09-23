import type { APIRoute } from 'astro'

export const GET: APIRoute = async (ctx) => {
	return ctx.redirect('/admin')
}
