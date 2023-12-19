import { AUTH_TOKEN } from '@/constants';
import type { APIContext } from 'astro';
import { Config } from 'sst/node/config';
import { Auth } from 'sst/node/future/auth';
import { Session } from 'sst/node/future/auth';

export async function GET(ctx: APIContext) {
	const code = ctx.url.searchParams.get('code');
	if (!code) {
		throw new Error('Code missing');
	}

	const client_id = ctx.url.host === 'localhost:4321' ? 'local' : 'admin';
	const origin = client_id === 'local' ? ctx.url.origin : 'https://admin.' + Config.DOMAIN_NAME;

	const response = await fetch(Auth.AdminSiteAuth.url + '/token', {
		method: 'POST',
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: ctx.url.host === 'localhost:4321' ? 'local' : 'main',
			code,
			redirect_uri: `${origin}${ctx.url.pathname}`,
		}),
	});

	const bodyText = await response.text();

	if (!response.ok) {
		const params = new URLSearchParams({
			alert: `An error occurred logging in: ${bodyText}`,
			type: 'error',
		});
		return ctx.redirect(`/login?${params}`);
	}

	const body = ((text: string) => {
		try {
			return JSON.parse(text);
		} catch (err) {
			console.error('An error occurred parsing the JSON.', { err, text });
		}
	})(bodyText);

	if (!body.access_token) {
		throw new Error('No access token');
	}

	ctx.cookies.set(AUTH_TOKEN, body.access_token, {
		maxAge: 60 * 60 * 24 * 30,
		httpOnly: true,
		secure: ctx.url.host !== 'localhost',
		path: '/',
	});

	const session = Session.verify(body.access_token);

	if (session.type === 'admin' || session.type === 'user') {
		return ctx.redirect(`/?alert=Logged in!`, 302);
	}
	return ctx.redirect(`/?alert=Not an authorized admin.&type=error`, 302);
}
