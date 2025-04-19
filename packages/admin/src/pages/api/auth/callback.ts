import { client, COOKIE } from '@core/lib/auth';
import type { APIContext, AstroCookieSetOptions } from 'astro';
import { Resource } from 'sst';

export async function GET(ctx: APIContext) {
	const code = ctx.url.searchParams.get('code');
	if (!code) {
		throw new Error('Code missing');
	}

	const origin = ctx.url.host.startsWith('localhost:')
		? ctx.url.origin
		: 'https://admin.' + Resource.CardsParams.DOMAIN_NAME;

	const exchanged = await client.exchange(code, `${origin}${ctx.url.pathname}`);

	if (exchanged.err) {
		throw exchanged.err;
	}

	const COOKIE_OPTIONS = {
		maxAge: 60 * 60 * 24 * 30,
		httpOnly: true,
		secure: !ctx.url.host.startsWith('localhost:'),
		path: '/',
	} as const satisfies AstroCookieSetOptions;

	ctx.cookies.set(COOKIE.ACCESS, exchanged.tokens.access, COOKIE_OPTIONS);
	ctx.cookies.set(COOKIE.REFRESH, exchanged.tokens.refresh, COOKIE_OPTIONS);

	return ctx.redirect(`/?alert=Logged in!`, 302);
}
