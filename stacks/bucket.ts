import { StackContext, Bucket, use } from 'sst/constructs';
import { Database } from './database';
import { getDomainName } from './constants';

export function DesignBucket({ stack }: StackContext) {
	const db = use(Database);
	const domainName = getDomainName(stack.stage);
	const origin = `https://${domainName}`;

	const cardDesignBucket = new Bucket(stack, 'CardDesigns', {
		cors: [
			{
				allowedMethods: ['POST', 'GET'],
				allowedOrigins: [origin, 'http://localhost:3000'],
			},
		],
		notifications: {
			fileUploaded: {
				function: 'packages/functions/src/s3/handle-image-upload.handler',
			},
		},
		defaults: {
			function: {
				bind: [db],
			},
		},
	});

	const frameBucket = new Bucket(stack, 'FrameDesigns', {
		cors: [
			{
				allowedMethods: ['POST', 'GET'],
				allowedOrigins: [origin, 'http://localhost:3000'],
			},
		],
		notifications: {
			fileUploaded: {
				function: 'packages/functions/src/s3/handle-frame-upload.handler',
			},
		},
		defaults: {
			function: {
				bind: [db],
			},
		},
	});

	return { cardDesignBucket, frameBucket };
}
