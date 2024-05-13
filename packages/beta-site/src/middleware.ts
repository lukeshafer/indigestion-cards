import { createMiddleware } from '@solidjs/start/middleware';
import { deleteCookie, getCookie } from 'vinxi/http';
import { AUTH_TOKEN } from './constants';
import { Session as SSTSession } from 'sst/node/future/auth';
import type { Session } from '@core/types';
import { getSiteConfig } from '@core/lib/site-config';

export default createMiddleware({
	onRequest: [
		async event => {
			const authCookie = getCookie(event.nativeEvent, AUTH_TOKEN);
			event.locals.session = SSTSession.verify(authCookie ?? '') as Session;

			if ((event.locals.session.properties.version || 0) < 2) {
				event.locals.session = null;
				deleteCookie(event.nativeEvent, AUTH_TOKEN);
			}

      event.locals.siteConfig = await getSiteConfig()
		},
	],
});
