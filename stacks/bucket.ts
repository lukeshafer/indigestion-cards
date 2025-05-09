import { StackContext, Bucket, use } from 'sst/constructs';
import { Database } from './database';
import { getDomainName } from './constants';

export function DesignBucket({ stack, app }: StackContext) {
	const { table } = use(Database);
	const domainName = getDomainName(stack.stage);
	const origin = `https://${domainName}`;

	const cardDraftBucket = new Bucket(stack, 'CardDrafts', {
		cors: [
			{
				allowedMethods: ['POST', 'GET'],
				allowedOrigins: app.mode === 'dev' ? ['http://localhost:4322'] : [origin],
			},
		],
		notifications: {
			fileUploaded: {
				function: 'packages/functions/src/s3/handle-image-upload.handler',
			},
		},
		defaults: {
			function: {
				bind: [table],
				runtime: 'nodejs22.x',
			},
		},
	});

	const frameDraftBucket = new Bucket(stack, 'FrameDrafts', {
		cors: [
			{
				allowedMethods: ['POST', 'GET'],
				allowedOrigins: app.mode === 'dev' ? ['http://localhost:4322'] : [origin],
			},
		],
		notifications: {
			fileUploaded: {
				function: 'packages/functions/src/s3/handle-frame-upload.handler',
			},
		},
		defaults: {
			function: {
				bind: [table],
				runtime: 'nodejs22.x',
			},
		},
	});

	const cardDesignBucket = new Bucket(stack, 'CardDesigns', {
		cors: [
			{
				allowedMethods: ['POST', 'GET'],
				allowedOrigins: app.mode === 'dev' ? ['http://localhost:4322'] : [origin],
			},
		],
		defaults: {
			function: {
				bind: [table],
			},
		},
	});

	const frameBucket = new Bucket(stack, 'FrameDesigns', {
		cors: [
			{
				allowedMethods: ['POST', 'GET'],
				allowedOrigins: app.mode === 'dev' ? ['http://localhost:4322'] : [origin],
			},
		],
		defaults: {
			function: {
				bind: [table],
			},
		},
	});

	return { cardDesignBucket, frameBucket, cardDraftBucket, frameDraftBucket };
}

export function DataRecoveryBucket({ stack }: StackContext) {
	const dataRecoveryBucket = new Bucket(stack, 'DataRecoveryBucket');
	return { dataRecoveryBucket };
}
