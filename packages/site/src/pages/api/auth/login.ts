import type { APIRoute } from 'astro';
import { authApi } from '@site/constants';
import { Resource } from 'sst';

export const GET: APIRoute = async (ctx) => {
	const client_id = ctx.url.host.startsWith('localhost:') ? 'local' : 'main';
	const isAdmin = ctx.locals.session?.type === 'admin';

	console.log("redirect_uri: ", 'https://' + Resource.CardsParams.DOMAIN_NAME + authApi.CALLBACK, { origin: ctx.url.origin, ConfigUrl: Resource.CardsParams.DOMAIN_NAME })
	const redirect_uri = client_id === 'local' ? ctx.url.origin + authApi.CALLBACK : 'https://' + Resource.CardsParams.DOMAIN_NAME + authApi.CALLBACK;

	const authParams = new URLSearchParams({
		client_id,
		redirect_uri,
		response_type: 'code',
		provider: isAdmin ? 'twitchStreamer' : 'twitchUser',
	}).toString();

	const url = `${Resource.SiteAuth.url}/authorize?${authParams}`;

	return ctx.redirect(url);
}
