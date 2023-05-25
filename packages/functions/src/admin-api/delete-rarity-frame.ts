import { ApiHandler, useJsonBody } from 'sst/node/api';
import { deleteS3ObjectByUrl } from '@lil-indigestion-cards/core/utils';
import { useSession } from 'sst/node/future/auth';
import { setAdminEnvSession } from '@lil-indigestion-cards/core/user';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};
	setAdminEnvSession(session.properties.username, session.properties.userId);

	const frameUrl = useJsonBody().frameUrl;

	if (!frameUrl) return { statusCode: 400, body: 'Missing frame url' };

	await deleteS3ObjectByUrl(frameUrl);

	return {
		statusCode: 200,
		body: 'Successfully deleted rarity frame',
	};
});
