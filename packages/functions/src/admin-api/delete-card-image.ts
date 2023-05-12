import { ApiHandler, useJsonBody } from 'sst/node/api';
import { deleteS3ObjectByUrl } from '@lil-indigestion-cards/core/utils';
import { useSession } from 'sst/node/future/auth';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};

	const imgUrl = useJsonBody().imgUrl;

	if (!imgUrl) return { statusCode: 400, body: 'Missing image url' };

	await deleteS3ObjectByUrl(imgUrl);

	return {
		statusCode: 200,
		body: 'Successfully deleted image',
	};
});
