import type { MiddlewareEndpointHandler, MiddlewareResponseHandler } from 'astro';
import { sequence } from 'astro/middleware';
import { html } from './lib/api';

export const passwordProtection: MiddlewareResponseHandler = async (ctx, next) => {
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

export const onRequest = sequence(passwordProtection);
