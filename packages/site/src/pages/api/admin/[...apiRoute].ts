import { AUTH_TOKEN } from '@/constants'
import { useAdmin } from '@/session'
import type { APIRoute } from 'astro'
import { Api } from 'sst/node/api'

export const all: APIRoute = async (ctx) => {
	const body = await ctx.request.text()
	const apiRoute = ctx.params.apiRoute
	if (!apiRoute) {
		return ctx.redirect('/404')
	}

	const session = useAdmin(ctx.cookies)
	const token = ctx.cookies.get(AUTH_TOKEN)
	if (!token || !session) {
		return new Response('Unauthorized', { status: 401 })
	}

	const redirectUrl = new URL(ctx.url.origin + (ctx.url.searchParams.get('redirect') ?? '/'))

	const response = await fetch(`${Api.api.url}/${apiRoute}`, {
		method: ctx.request.method,
		headers: {
			'Content-Type':
				ctx.request.headers.get('Content-Type') ?? 'application/x-www-form-urlencoded',
			authorization: `Bearer ${ctx.cookies.get(AUTH_TOKEN).value ?? ''}`,
		},
		body: body,
	})

	const responseBody = await response.text()
	let message: string
	let params: URLSearchParams | null = null
	try {
		const jsonBody = JSON.parse(responseBody)
		message = jsonBody.message
		if (jsonBody.redirectPath) {
			redirectUrl.pathname = jsonBody.redirectPath
		}
		params = new URLSearchParams(jsonBody.params)
		params.forEach((value, key) => {
			redirectUrl.searchParams.set(key, value)
		})
	} catch (e) {
		message = responseBody
	}

	if (response.status === 401) {
		ctx.cookies.delete(AUTH_TOKEN, { path: '/' })
		redirectUrl.searchParams.set('alert', "Unauthorized. You've been logged out.")
		return ctx.redirect(redirectUrl.toString(), 302)
	}

	if (response.status === 404) {
		return ctx.redirect('/404')
	}

	if (!response.ok) {
		redirectUrl.searchParams.set(
			'alert',
			message || ctx.url.searchParams.get('errorMessage') || 'An error occurred.'
		)
		return ctx.redirect(redirectUrl.toString(), 302)
	}

	redirectUrl.searchParams.set(
		'alert',
		message || ctx.url.searchParams.get('successMessage') || 'Success!'
	)
	redirectUrl.searchParams.set('alertType', 'success')
	return ctx.redirect(redirectUrl.toString(), 302)
}
