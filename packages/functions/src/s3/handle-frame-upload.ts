import { S3Handler } from 'aws-lambda';
import { createUnmatchedDesignImage } from '@lib/unmatched-image';
import { setAdminEnvSession } from '@lib/session';

export const handler: S3Handler = async (event) => {
	setAdminEnvSession('S3 Event', 's3_event');

	event.Records.forEach(async (record) => {
		if (record.eventName !== 'ObjectCreated:Post' && record.eventName !== 'ObjectCreated:Put')
			return;

		const key = record.s3.object.key;
		await createUnmatchedDesignImage({
			url: `https://${record.s3.bucket.name}.s3.amazonaws.com/${key}`,
			imageId: key,
			type: 'frame',
		});
	});
};
