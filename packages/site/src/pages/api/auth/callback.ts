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

	const client_id = ctx.url.host.startsWith('localhost:') ? 'local' : 'main';
	const origin = client_id === 'local' ? ctx.url.origin : 'https://' + Config.DOMAIN_NAME;
	//console.log({ client_id, origin })

	const response = await fetch(Auth.AdminSiteAuth.url + '/token', {
		method: 'POST',
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id,
			code,
			redirect_uri: `${origin}${ctx.url.pathname}`,
		}),
	})
		.then(r => r.text())
		.then(r => {
			//console.log(r);
			return JSON.parse(r);
		})
		.catch(err => {
			console.error('An error occurred parsing the JSON.', { err });
		});

	if (!response.access_token) {
		throw new Error('No access token');
	}

	const session = Session.verify(response.access_token);

	if (session.type === 'admin' || session.type === 'user') {
		ctx.cookies.set(AUTH_TOKEN, response.access_token, {
			expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
			httpOnly: true,
			sameSite: 'lax',
			secure: ctx.url.host !== 'localhost:',
			path: '/',
		});

		return ctx.redirect(`/?alert=Logged in!`, 302);
	}
	return ctx.redirect(`/?alert=Not an authorized user.&type=error`, 302);
}
