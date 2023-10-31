import { Auth } from 'sst/node/future/auth';
import type { APIRoute } from 'astro';
import { authApi } from '@/constants';
import { Config } from 'sst/node/config';

export const GET: APIRoute = async (ctx) => {
	const client_id = ctx.url.host === 'localhost:4321' ? 'local' : 'main';
	const isAdmin = ctx.locals.session?.type === 'admin';

	console.log("redirect_uri: ", 'https://' + Config.DOMAIN_NAME + authApi.CALLBACK, { origin: ctx.url.origin, ConfigUrl: Config.DOMAIN_NAME })
	const redirect_uri = client_id === 'local' ? ctx.url.origin + authApi.CALLBACK : 'https://' + Config.DOMAIN_NAME + authApi.CALLBACK;

	const authParams = new URLSearchParams({
		client_id,
		redirect_uri,
		response_type: 'code',
		provider: isAdmin ? 'twitchStreamer' : 'twitchUser',
	}).toString();

	const url = `${Auth.AdminSiteAuth.url}/authorize?${authParams}`;

	return ctx.redirect(url);
}
