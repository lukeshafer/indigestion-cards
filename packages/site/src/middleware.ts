import type { MiddlewareResponseHandler } from 'astro';
import { sequence } from 'astro/middleware';
import { html } from './lib/api';
import { HTML_API_PATH } from './constants';

const appendText: MiddlewareResponseHandler = async (ctx, next) => {
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

export const onRequest = sequence(passwordProtection, appendText);
