import { ApiHandler, useMethod, usePathParam } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';
import * as openCard from './admin-api/open-card';
import * as packToOpen from './admin-api/pack-to-open';
import { setAdminEnvSession } from '@lil-indigestion-cards/core/user';

const routes: Record<string, Record<string, (...args: any[]) => any>> = {
	'open-card': openCard,
	'pack-to-open': packToOpen,
};

export const handler = ApiHandler(async (...args) => {
	const session = useSession();
	if (!session || session.type !== 'admin') return { statusCode: 401, body: 'Unauthorized' };
	setAdminEnvSession(session.properties.username, session.properties.userId);

	const method = useMethod();
	const pathParam = usePathParam('proxy');

	if (!pathParam) return { statusCode: 400, body: 'Bad Request' };

	const route = routes[pathParam];
	if (!route) return { statusCode: 404, body: 'Not Found' };

	return route[method](...args);
});
