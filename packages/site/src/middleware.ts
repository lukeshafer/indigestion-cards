import type { AstroCookieSetOptions, MiddlewareHandler } from 'astro';
import { sequence } from 'astro/middleware';
import { getAdminUserById } from '@core/lib/admin-user';
import { client, COOKIE, subjects } from '@core/lib/auth';
import { getSiteConfig } from '@core/lib/site-config';

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

		return next();
	}

	const verified = await client.verify(subjects, accessToken.value, {
		refresh: refreshToken?.value,
	});

	if (verified.err) {
		ctx.locals.session = null;
		ctx.cookies.delete(COOKIE.ACCESS);
		ctx.cookies.delete(COOKIE.REFRESH);

		return next();
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

	if (session.type === 'public') {
		ctx.locals.session = null;
		ctx.cookies.delete(COOKIE.ACCESS);
		ctx.cookies.delete(COOKIE.REFRESH);

		return next();
	}

	process.env.SESSION_USER_ID = session.properties.userId;
	process.env.SESSION_USERNAME = session.properties.username;
	process.env.SESSION_TYPE = session.type;

	ctx.locals.user = session;

	if (session.type === 'admin') {
		const adminUser = await getAdminUserById(session?.properties.userId ?? '');
		if (!adminUser) {
			ctx.locals.session = null;
			ctx.locals.user = null;
			ctx.locals.admin = null;
			ctx.cookies.delete(COOKIE.ACCESS);
			ctx.cookies.delete(COOKIE.REFRESH);

			return next();
		}
		ctx.locals.admin = session;
	} else {
		ctx.locals.admin = null;
	}

	return next();
};

const loadSiteConfig: MiddlewareHandler = async (ctx, next) => {
	ctx.locals.siteConfig = await getSiteConfig();

	return next();
};

export const onRequest = sequence(loadSiteConfig, auth, transformMethod);
