import type { APIRoute } from "astro";
import { Auth } from 'sst/node/future/auth';
import { authApi } from '@/constants';

export const GET: APIRoute = async (ctx) => {
	console.log("login.ts: GET")
	const client_id = ctx.url.host === 'localhost:4321' ? 'local' : 'main';
	console.log({client_id})
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
