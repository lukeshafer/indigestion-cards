import type { MiddlewareResponseHandler } from 'astro';
import { sequence } from 'astro/middleware';
import { html } from './lib/api';
import { AUTH_TOKEN, HTML_API_PATH, PUBLIC_ROUTES } from './constants';
import { Session as SSTSession } from 'sst/node/future/auth';

const auth: MiddlewareResponseHandler = async (ctx, next) => {
	//console.log(ctx.url.pathname);
	const cookie = ctx.cookies.get(AUTH_TOKEN);
	const session = SSTSession.verify(cookie.value ?? '');
	//console.log(session);

	// @ts-expect-error
	ctx.locals.session = session;

	const currentRoute = ctx.url.pathname;
	const isPublicRoute = PUBLIC_ROUTES.some((route) => {
		if (route.endsWith('*')) {
			return currentRoute.startsWith(route.slice(0, -1));
		}
		return currentRoute === route;
	});

	if (isPublicRoute) return next();

	const isAdmin = ctx.locals.session?.type === 'admin';
	if (!isAdmin && ctx.url.pathname !== '/404') {
		//console.log("Not admin, redirecting to '/404'");
		return ctx.redirect('/404');
	}

	ctx.locals.admin = ctx.locals.session?.type === 'admin' ? ctx.locals.session : null;
	ctx.locals.user =
		ctx.locals.session?.type === 'user' || ctx.locals.session?.type === 'admin'
			? ctx.locals.session
			: null;

	return next();
};

const appendText: MiddlewareResponseHandler = async (ctx, next) => {
	// only run this middleware if the request is for an HTML Endpoint
	if (!ctx.url.pathname.startsWith(HTML_API_PATH)) return next();
	const response = await next();
	if (response.headers.get('content-type') !== 'text/html') return response;

	const body = await response.text();
	// extract only the <body/> content
	const [, bodyContent] = body.match(/<body>(.*)<\/body>/s) ?? [];
	if (!bodyContent) {
		console.error('No body content found -- make sure you have a <body> tag in your HTML!');
	}

	return new Response(bodyContent, {
		headers: response.headers,
		status: response.status,
	});
};

const passwordProtection: MiddlewareResponseHandler = async (ctx, next) => {
	if (ctx.cookies.get('lilind_code').value === 'pants') return next();

	const body = await ctx.request.text();
	const params = new URLSearchParams(body);

	if (params.get('password') === 'pants') return next();

	return html`
		<head>
			<link rel="stylesheet" href="https://unpkg.com/marx-css/css/marx.min.css" />
		</head>
		<body>
			<main>
				<form method="post" action="/">
					<label for="password">Password</label>
					<input type="password" name="password" id="password" />
					<button type="submit">Submit</button>
				</form>
			</main>
		</body>
	`;
};

export const onRequest = sequence(passwordProtection, auth, appendText);
