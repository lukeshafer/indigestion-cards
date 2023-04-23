import { Auth } from 'sst/node/future/auth'
import { useUser } from '@/session'
import type { APIRoute } from 'astro'
import { authApi } from '@/constants'

export const get: APIRoute = async (ctx) => {
	const user = useUser(ctx.cookies)
	if (user?.type === 'user') return ctx.redirect('/')

	const authParams = new URLSearchParams({
		client_id: 'local',
		redirect_uri: ctx.url.origin + authApi.CALLBACK,
		response_type: 'code',
		provider: 'twitch',
	}).toString()

	const authUrl = `${Auth.AdminSiteAuth.url}/authorize?${authParams}`
	return ctx.redirect(authUrl)
}
