import type { MiddlewareHandler } from 'astro';
import { sequence } from 'astro/middleware';
import { getAdminUserById } from '@lib/admin-user';
import { AUTH_TOKEN, PUBLIC_ROUTES, USER_ROUTES } from './constants';
import { Session as SSTSession } from 'sst/node/future/auth';
import type { Session } from '@lil-indigestion-cards/core/types';
import { getSiteConfig } from '@lil-indigestion-cards/core/lib/site-config';

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
  const cookie = ctx.cookies.get(AUTH_TOKEN);

  // @ts-expect-error - cookie string is a fine input for this function
  const session: Session = SSTSession.verify(cookie?.value ?? '');
  ctx.locals.session = session;
  //console.log({ session });

	if ((session.properties.version || 0) < 2) {
		ctx.locals.session = null;
		ctx.cookies.delete(AUTH_TOKEN);
	}

  if (session.type === 'admin') {
    const adminUser = await getAdminUserById(session?.properties.userId ?? '');
    if (!adminUser) {
      ctx.locals.session = null;
      ctx.cookies.delete(AUTH_TOKEN);
      //console.error('No admin user found for session:', session);
    }
  }

  if (ctx.locals.session && cookie) {
    ctx.cookies.set(AUTH_TOKEN, cookie.value, {
      //maxAge: 31536000,
      expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      httpOnly: true,
      sameSite: 'lax',
      secure: ctx.url.host !== 'localhost:',
      path: '/',
    });
  }

  const checkIncludesCurrentRoute = (routeList: readonly string[]) =>
    routeList.some(route =>
      route.endsWith('*')
        ? currentRoute.startsWith(route.slice(0, -1))
        : currentRoute === route
    );

  const currentRoute = ctx.url.pathname;
  const isPublicRoute = checkIncludesCurrentRoute(PUBLIC_ROUTES);
  const isUserRoute = isPublicRoute || checkIncludesCurrentRoute(USER_ROUTES);

  if (currentRoute.startsWith('/trade')) {
    console.log('checking if trading is enabled');
    const siteConfig = await getSiteConfig();
    if (!siteConfig.tradingIsEnabled) {
      console.log('trading is not enabled, not a valid route');
      return ctx.redirect('/404');
    }
  }

  process.env.SESSION_USER_ID = session?.properties.userId ?? undefined;
  process.env.SESSION_USERNAME = session?.properties.username ?? undefined;
  process.env.SESSION_TYPE = session?.type ?? undefined;

  ctx.locals.admin = ctx.locals.session?.type === 'admin' ? ctx.locals.session : null;
  ctx.locals.user =
    ctx.locals.session?.type === 'user' || ctx.locals.session?.type === 'admin'
      ? ctx.locals.session
      : null;

  //console.log({ currentRoute, isPublicRoute, isUserRoute, session })
  if (!isPublicRoute) {
    const isUserOnUserRoute = isUserRoute && ctx.locals.session?.type === 'user';
    const isAdmin = ctx.locals.session?.type === 'admin';
    if (!isAdmin && !isUserOnUserRoute && ctx.url.pathname !== '/404') {
      //console.log("Not admin, redirecting to '/404'");
      return ctx.redirect('/404');
    }
  }

  return next();
};

export const onRequest = sequence(auth, transformMethod);
