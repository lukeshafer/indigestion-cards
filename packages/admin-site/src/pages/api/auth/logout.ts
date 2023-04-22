import type { APIRoute } from 'astro'

export const get: APIRoute = async (ctx) => {
	ctx.cookies.delete('sst_auth_token', { path: '/' })

	return ctx.redirect('/', 302)
}
