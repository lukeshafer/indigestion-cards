import type { APIRoute } from 'astro'
import { AUTH_TOKEN } from '@/constants'

export const get: APIRoute = async (ctx) => {
	ctx.cookies.delete(AUTH_TOKEN, { path: '/' })

	return ctx.redirect('/', 302)
}
