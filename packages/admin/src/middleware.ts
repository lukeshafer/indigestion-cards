import type { AstroCookieSetOptions, MiddlewareHandler } from 'astro';
import { sequence } from 'astro/middleware';
import { getAdminUserById } from '@core/lib/admin-user';
import { setAdminEnvSession } from '@core/lib/session';
import { client, COOKIE, subjects } from '@core/lib/auth';

const transformMethod: MiddlewareHandler = async (ctx, next) => {
	const formMethod = ctx.url.searchParams.get('formmethod');
	if (!formMethod) return next();
	if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(formMethod.toUpperCase())) return next();

	const reqMethod = ctx.request.method;
	if (reqMethod === formMethod) return next();

	ctx.request = new Request(ctx.request, { method: formMethod.toUpperCase() });
	return next();
};

const auth: MiddlewareHandler = async (ctx, next) => {
	const accessToken = ctx.cookies.get(COOKIE.ACCESS);
	const refreshToken = ctx.cookies.get(COOKIE.REFRESH);

	if (!accessToken) {
		ctx.locals.session = null;
		ctx.cookies.delete(COOKIE.ACCESS);
		ctx.cookies.delete(COOKIE.REFRESH);

		return ctx.redirect('/login' + ctx.url.search);
	}

	const verified = await client.verify(subjects, accessToken.value, {
		refresh: refreshToken?.value,
	});

	if (verified.err) {
		ctx.locals.session = null;
		ctx.cookies.delete(COOKIE.ACCESS);
		ctx.cookies.delete(COOKIE.REFRESH);

		return ctx.redirect('/login' + ctx.url.search);
	}

	if (verified.tokens) {
		const COOKIE_OPTIONS = {
			httpOnly: true,
			sameSite: 'lax',
			path: '/',
			expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // one year from now
			secure: ctx.url.host !== 'localhost:',
		} as const satisfies AstroCookieSetOptions;

		ctx.cookies.set(COOKIE.ACCESS, verified.tokens.access, COOKIE_OPTIONS);
		ctx.cookies.set(COOKIE.REFRESH, verified.tokens.refresh, COOKIE_OPTIONS);
	}

	const session = verified.subject;
	ctx.locals.session = session;

	if (session.type !== 'admin') {
		ctx.locals.session = null;
		ctx.cookies.delete(COOKIE.ACCESS);
		ctx.cookies.delete(COOKIE.REFRESH);

		return ctx.redirect('/login' + ctx.url.search);
	}

	const adminUser = await getAdminUserById(session?.properties.userId ?? '');
	if (!adminUser) {
		ctx.locals.session = null;
		ctx.cookies.delete(COOKIE.ACCESS);
		ctx.cookies.delete(COOKIE.REFRESH);

		return ctx.redirect('/login' + ctx.url.search);
	}

	setAdminEnvSession(adminUser.username, adminUser.userId);
	if (ctx.url.pathname === '/login') return ctx.redirect('/');

	if (ctx.url.pathname === '/login' || ctx.url.pathname.startsWith('/api/auth/')) return next();

	return ctx.redirect('/login' + ctx.url.search);
};

const logMiddleware: MiddlewareHandler = async (ctx, next) => {
	console.log(`[${ctx.request.method} |  ${ctx.url.pathname}]`);
	console.log(`Session type: ${ctx.locals.session?.type}`);
	return next();
};

export const onRequest = sequence(auth, transformMethod, logMiddleware);
