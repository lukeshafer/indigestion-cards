import { ApiHandler, useJsonBody } from 'sst/node/api';
import { Bucket } from 'sst/node/bucket';
import { deleteUnmatchedDesignImage } from '@lil-indigestion-cards/core/card';
import { S3 } from 'aws-sdk';
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

	const data = useJsonBody() as unknown;

	if (!data || typeof data !== 'object') return { statusCode: 400, body: 'Missing body' };
	if (!('key' in data) || typeof data.key !== 'string')
		return { statusCode: 400, body: 'Missing key' };
	if (!('type' in data) || (data.type !== 'cardDesign' && data.type !== 'frame'))
		return { statusCode: 400, body: 'Missing or invalid type' };

	const bucketName =
		data.type === 'cardDesign' ? Bucket.CardDrafts.bucketName : Bucket.FrameDrafts.bucketName;

	const s3 = new S3();
	try {
		await deleteUnmatchedDesignImage({ imageId: data.key, type: data.type });
		await s3
			.deleteObject({
				Bucket: bucketName,
				Key: data.key,
			})
			.promise();

		return {
			statusCode: 200,
			body: 'Successfully deleted unused image',
		};
	} catch (error) {
		console.error(error);
		return {
			statusCode: 500,
			body: JSON.stringify(error),
		};
	}
});
