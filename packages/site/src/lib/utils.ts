import { Auth } from 'sst/node/future/auth';
import { authApi } from '@/constants';

export function getLoginLink(ctx: { isStreamer?: boolean; url: URL }) {
	const client_id = ctx.url.host === 'localhost:3000' ? 'local' : 'main';

	const authParams = new URLSearchParams({
		client_id: client_id,
		redirect_uri: ctx.url.origin + authApi.CALLBACK,
		response_type: 'code',
		provider: ctx.isStreamer ? 'twitchStreamer' : 'twitchUser',
	}).toString();

	return `${Auth.AdminSiteAuth.url}/authorize?${authParams}`;
}
