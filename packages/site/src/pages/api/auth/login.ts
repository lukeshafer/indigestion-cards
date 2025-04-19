import type { APIRoute, AstroCookieSetOptions } from 'astro';
import { authApi } from '@site/constants';
import { Resource } from 'sst';
import { COOKIE, client,  subjects } from '@core/lib/auth';

export const GET: APIRoute = async ctx => {
	const accessToken = ctx.cookies.get(COOKIE.ACCESS);
	const refreshToken = ctx.cookies.get(COOKIE.REFRESH);

	if (accessToken) {
		const verified = await client.verify(subjects, accessToken.value, {
			refresh: refreshToken?.value,
		});

		if (!verified.err && verified.tokens) {
			const COOKIE_OPTIONS = {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // one year from now
				secure: ctx.url.host !== 'localhost:',
			} as const satisfies AstroCookieSetOptions;

			ctx.cookies.set(COOKIE.ACCESS, verified.tokens.access, COOKIE_OPTIONS);
			ctx.cookies.set(COOKIE.REFRESH, verified.tokens.refresh, COOKIE_OPTIONS);

			ctx.redirect('/');
		}
	}

	const isAdmin = ctx.locals.session?.type === 'admin';
	const redirectURI =
ctx.url.host.startsWith('localhost:')
			? ctx.url.origin + authApi.CALLBACK
			: 'https://' + Resource.CardsParams.DOMAIN_NAME + authApi.CALLBACK;

	const result = await client.authorize(redirectURI, 'code', {
		provider: isAdmin ? 'twitchStreamer' : 'twitch',
	});

	return ctx.redirect(result.url);
};
