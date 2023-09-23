import { Auth } from 'sst/node/future/auth';
import type { APIRoute } from 'astro';
import { authApi } from '@/constants';

export const GET: APIRoute = async (ctx) => {
	const streamer = ctx.url.searchParams.get('streamer');

	const client_id = ctx.url.host === 'localhost:4321' ? 'local' : 'main';

	const authParams = new URLSearchParams({
		client_id: client_id,
		redirect_uri: ctx.url.origin + authApi.CALLBACK,
		response_type: 'code',
		provider: streamer === 'true' ? 'twitchStreamer' : 'twitchUser',
	}).toString();

	const authUrl = `${Auth.AdminSiteAuth.url}/authorize?${authParams}`;
	return ctx.redirect(authUrl);
};
