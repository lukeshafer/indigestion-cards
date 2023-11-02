import type { MiddlewareResponseHandler } from 'astro';
import { sequence } from 'astro/middleware';
import { getAdminUserById } from '@lib/admin-user';
import { AUTH_TOKEN, PUBLIC_ROUTES } from './constants';
import { Session as SSTSession } from 'sst/node/future/auth';
import type { Session } from '@lil-indigestion-cards/core/types';

const transformMethod: MiddlewareResponseHandler = async (ctx, next) => {
	const formMethod = ctx.url.searchParams.get('formmethod');
	if (!formMethod) return next();
	if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(formMethod.toUpperCase())) return next();

	const reqMethod = ctx.request.method;
	if (reqMethod === formMethod) return next();

	ctx.request = new Request(ctx.request, { method: formMethod.toUpperCase() });
	return next();
};

const auth: MiddlewareResponseHandler = async (ctx, next) => {
	const cookie = ctx.cookies.get(AUTH_TOKEN);

	// @ts-expect-error - cookie string is a fine input for this function
	const session: Session = SSTSession.verify(cookie?.value ?? '');
	ctx.locals.session = session;

	if (session.type === 'admin') {
		const adminUser = await getAdminUserById(session?.properties.userId ?? '');
		if (!adminUser) {
			ctx.locals.session = null;
			ctx.cookies.delete(AUTH_TOKEN);
			//console.error('No admin user found for session:', session);
		}
	}

	const currentRoute = ctx.url.pathname;
	const isPublicRoute = PUBLIC_ROUTES.some((route) => {
		if (route.endsWith('*')) {
			return currentRoute.startsWith(route.slice(0, -1));
		}
		return currentRoute === route;
	});

	process.env.SESSION_USER_ID = session?.properties.userId ?? undefined;
	process.env.SESSION_USERNAME = session?.properties.username ?? undefined;
	process.env.SESSION_TYPE = session?.type ?? undefined;

	ctx.locals.admin = ctx.locals.session?.type === 'admin' ? ctx.locals.session : null;
	ctx.locals.user =
		ctx.locals.session?.type === 'user' || ctx.locals.session?.type === 'admin'
			? ctx.locals.session
			: null;

	if (!isPublicRoute) {
		const isAdmin = ctx.locals.session?.type === 'admin';
		if (!isAdmin && ctx.url.pathname !== '/404') {
			//console.log("Not admin, redirecting to '/404'");
			return ctx.redirect('/404');
		} 
	}

	return next();
};

//const passwordProtection: MiddlewareResponseHandler = async (ctx, next) => {
//if (ctx.cookies.get('lilind_code').value === 'pants') return next();

//const body = await ctx.request.text();
//const params = new URLSearchParams(body);

//if (params.get('password') === 'pants') return next();

//return html`
//<head>
//<link rel="stylesheet" href="https://unpkg.com/marx-css/css/marx.min.css" />
//</head>
//<body>
//<main>
//<form method="post" action="/">
//<label for="password">Password</label>
//<input type="password" name="password" id="password" />
//<button type="submit">Submit</button>
//</form>
//</main>
//</body>
//`;
//};

export const onRequest = sequence(auth, transformMethod);
