import { Auth } from 'sst/node/future/auth';
import type { APIRoute } from 'astro';
import { authApi } from '@/constants';

export const GET: APIRoute = async (ctx) => {
	const client_id = ctx.url.host === 'localhost:4321' ? 'local' : 'main';
	const isAdmin = ctx.locals.session?.type === 'admin';

	console.log("redirect_uri: ", ctx.url.origin + authApi.CALLBACK)

	const authParams = new URLSearchParams({
		client_id: client_id,
		redirect_uri: ctx.url.origin + authApi.CALLBACK,
		response_type: 'code',
		provider: isAdmin ? 'twitchStreamer' : 'twitchUser',
	}).toString();

	const url = `${Auth.AdminSiteAuth.url}/authorize?${authParams}`;

	return ctx.redirect(url);
}
