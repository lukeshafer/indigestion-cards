import { Auth } from 'sst/node/future/auth';
import type { APIRoute } from 'astro';
import { authApi } from '@/constants';

export const get: APIRoute = async (ctx) => {
	const streamer = ctx.url.searchParams.get('streamer');

	const authParams = new URLSearchParams({
		client_id: 'local',
		redirect_uri: ctx.url.origin + authApi.CALLBACK,
		response_type: 'code',
		provider: streamer === 'true' ? 'twitchStreamer' : 'twitchUser',
	}).toString();

	const authUrl = `${Auth.AdminSiteAuth.url}/authorize?${authParams}`;
	return ctx.redirect(authUrl);
};
