import { StackContext, StaticSite, use } from 'sst/constructs';
import { API } from './api';
import { Auth } from './auth';
import { WebsocketsAPI } from './websockets-api';
import { getDomainName, getHostedZone } from './constants';

export function Frontend({ app, stack }: StackContext) {
	const { siteApi } = use(API);
	const { siteAuth } = use(Auth);
	const { wsApi } = use(WebsocketsAPI);

	if (!siteApi.url) {
		throw new Error("Cannot build frontend, api URL doesn't exist.");
	}

	const hostedZone = getHostedZone(stack.stage);
	const baseDomain = getDomainName(stack.stage);

	const frontend = new StaticSite(stack, 'Frontend', {
		path: 'packages/frontend',
		buildOutput: 'dist',
		buildCommand: 'pnpm run build',
		environment: {
			VITE_SITE_API_URL: siteApi.url,
			VITE_AUTH_URL: siteAuth.url,
			VITE_WS_API_URL: wsApi.url,
		},
		customDomain:
			app.mode === 'dev'
				? undefined
				: {
						domainName: baseDomain,
						hostedZone: hostedZone,
					},
	});

	stack.addOutputs({
		FrontendUrl: frontend.url,
	});

	return { frontend };
}
