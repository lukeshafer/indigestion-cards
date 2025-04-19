import { COOKIE, client } from '@core/lib/auth';
import type { APIContext, AstroCookieSetOptions } from 'astro';
import { Resource } from 'sst';

export async function GET(ctx: APIContext) {
	const code = ctx.url.searchParams.get('code');
	if (!code) {
		throw new Error('Code missing');
	}

	const origin =
		ctx.url.host.startsWith('localhost:') ? ctx.url.origin : 'https://' + Resource.CardsParams.DOMAIN_NAME;

	const exchanged = await client.exchange(code, `${origin}${ctx.url.pathname}`);

	if (exchanged.err) {
		throw exchanged.err;
	}

	const COOKIE_OPTIONS = {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // one year from now
		secure: ctx.url.host !== 'localhost:',
	} as const satisfies AstroCookieSetOptions;

	ctx.cookies.set(COOKIE.ACCESS, exchanged.tokens.access, COOKIE_OPTIONS);
	ctx.cookies.set(COOKIE.REFRESH, exchanged.tokens.refresh, COOKIE_OPTIONS);

	return ctx.redirect(`/?alert=Logged in!`, 302);
}
