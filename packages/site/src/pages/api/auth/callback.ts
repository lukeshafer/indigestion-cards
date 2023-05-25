import { AUTH_TOKEN } from '@/constants';
import type { APIContext } from 'astro';
import { Auth } from 'sst/node/future/auth';

export async function get(ctx: APIContext) {
	const code = ctx.url.searchParams.get('code');
	if (!code) {
		throw new Error('Code missing');
	}
	const response = await fetch(Auth.AdminSiteAuth.url + '/token', {
		method: 'POST',
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: ctx.url.host === 'localhost:3000' ? 'local' : 'main',
			code,
			redirect_uri: `${ctx.url.origin}${ctx.url.pathname}`,
		}),
	}).then((r) => r.json());

	if (!response.access_token) {
		throw new Error('No access token');
	}

	ctx.cookies.set(AUTH_TOKEN, response.access_token, {
		maxAge: 60 * 60 * 24 * 30,
		httpOnly: true,
		path: '/',
	});

	return ctx.redirect('/', 302);
}
