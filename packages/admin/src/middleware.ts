import type { MiddlewareResponseHandler } from 'astro';
import { sequence } from 'astro/middleware';
import { getAdminUserById } from '@lib/admin-user';
import { AUTH_TOKEN } from './constants';
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
		} else {
      if (ctx.url.pathname === '/login') return ctx.redirect('/')
			return next();
		}
	}

  console.log(ctx.url.pathname)
	if (ctx.url.pathname === '/login' || ctx.url.pathname === '/api/auth/callback') return next();
	else return ctx.redirect('/login' + ctx.url.search);
};

export const onRequest = sequence(auth, transformMethod);
