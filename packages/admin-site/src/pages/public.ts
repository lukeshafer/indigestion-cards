import type { APIContext } from 'astro'

export function get(ctx: APIContext) {
	return ctx.redirect('/?' + ctx.url.searchParams.toString())
}
