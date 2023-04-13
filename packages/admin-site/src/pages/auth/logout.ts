import type { APIRoute } from 'astro'

export const get: APIRoute = async (ctx) => {
	ctx.cookies.delete('session', { path: '/' })

	return ctx.redirect('/', 302)
}
