import { domainName, imports } from './config';
import { database } from './database';

const origin = $dev === true ? 'http://localhost:4322' : `https://${domainName}`;

export const cardDraftBucket = new sst.aws.Bucket('CardDrafts', {
	access: 'public',
	cors: {
		allowMethods: ['POST', 'GET'],
		allowOrigins: [origin],
	},

	transform: {
		bucket(args) {
			args.forceDestroy = undefined;
		},
	},
});

cardDraftBucket.notify({
	notifications: [
		{
			name: 'fileUploaded',
			function: {
				handler: 'packages/functions/src/s3/handle-image-upload.handler',
				link: [database],
				runtime: 'nodejs24.x',
			},
		},
	],
});

export const frameDraftBucket = new sst.aws.Bucket('FrameDrafts', {
	access: 'public',
	cors: {
		allowMethods: ['POST', 'GET'],
		allowOrigins: [origin],
	},

	transform: {
		bucket(args) {
			args.forceDestroy = undefined;
		},
	},
});

frameDraftBucket.notify({
	notifications: [
		{
			name: 'fileUploaded',
			function: {
				handler: 'packages/functions/src/s3/handle-frame-upload.handler',
				link: [database],
				runtime: 'nodejs24.x',
			},
		},
	],
});

export const cardDesignBucket = new sst.aws.Bucket('CardDesigns', {
	access: 'public',
	cors: {
		allowMethods: ['POST', 'GET'],
		allowOrigins: [origin],
	},

	transform: {
		bucket(args, opts) {
			args.forceDestroy = undefined;
			args.bucket = imports.cardDesignsBucketName;
			opts.import = imports.cardDesignsBucketName;
		},
	},
});

export const frameDesignBucket = new sst.aws.Bucket('FrameDesigns', {
	access: 'public',
	cors: {
		allowMethods: ['POST', 'GET'],
		allowOrigins: [origin],
	},

	transform: {
		bucket(args, opts) {
			args.forceDestroy = undefined;
			args.bucket = imports.frameDesignsBucketName;
			opts.import = imports.frameDesignsBucketName;
		},
	},
});
