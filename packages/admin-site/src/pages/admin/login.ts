import type { APIRoute } from 'astro'

export const get: APIRoute = async (ctx) => {
	return ctx.redirect('/admin')
}
