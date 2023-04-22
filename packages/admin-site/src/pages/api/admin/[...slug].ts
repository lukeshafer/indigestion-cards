import { useUser } from '@/session'
import type { APIRoute } from 'astro'
import { Api } from 'sst/node/api'

export const all: APIRoute = async (ctx) => {
	const body = await ctx.request.text()
	const slug = ctx.params.slug
	if (!slug) {
		return ctx.redirect('/404')
	}

	const session = useUser(ctx.cookies)
	const token = ctx.cookies.get('sst_auth_token')
	if (!token || !session) {
		return new Response('Unauthorized', { status: 401 })
	}

	console.log('redirect', ctx.url.origin + (ctx.url.searchParams.get('redirect') ?? '/'))
	const redirectUrl = new URL(ctx.url.origin + (ctx.url.searchParams.get('redirect') ?? '/'))
	const errorMessage = ctx.url.searchParams.get('errorMessage') ?? 'An error occurred.'

	const response = await fetch(`${Api.api.url}/${slug}`, {
		method: ctx.request.method,
		headers: {
			'Content-Type':
				ctx.request.headers.get('Content-Type') ?? 'application/x-www-form-urlencoded',
			authorization: `Bearer ${ctx.cookies.get('sst_auth_token').value ?? ''}`,
		},
		body: body,
	})

	const responseBody = await response.text()

	if (response.status === 401) {
		ctx.cookies.delete('sst_auth_token', { path: '/' })
		redirectUrl.searchParams.set('alert', "Unauthorized. You've been logged out.")
		return ctx.redirect(redirectUrl.toString(), 302)
	}

	if (response.status === 404) {
		return ctx.redirect('/404')
	}

	if (!response.ok) {
		redirectUrl.searchParams.set('alert', errorMessage)
		return ctx.redirect(redirectUrl.toString(), 302)
	}

	let successMessage: string
	try {
		const jsonBody = JSON.parse(responseBody)
		successMessage = jsonBody.message
	} catch (e) {
		successMessage = responseBody
	}
	successMessage ||= ctx.url.searchParams.get('successMessage') || 'Success!'

	redirectUrl.searchParams.set('alert', successMessage)
	redirectUrl.searchParams.set('alertType', 'success')
	return ctx.redirect(redirectUrl.toString(), 302)
}
