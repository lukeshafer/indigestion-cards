import { domainName, imports } from './config';
import { database } from './database';

const origin = $dev === true ? 'http://localhost:4322' : `https://${domainName}`;

export const cardDraftBucket = new sst.aws.Bucket('CardDrafts', {
	cors: {
		allowMethods: ['POST', 'GET'],
		allowOrigins: [origin],
	},

	transform: {
		bucket(args, opts) {
			args.forceDestroy = undefined;

			switch ($app.stage) {
				case 'luke': {
					args.bucket = imports.luke.cardDraftsBucketName;
					opts.import = imports.luke.cardDraftsBucketName;
					return;
				}
				case 'luke-v3':
					return;
				default:
					throw new Error(`Bucket CardDrafts import not setup for stage ${$app.stage}`);
			}
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
				runtime: 'nodejs22.x',
			},
		},
	],
});

export const frameDraftBucket = new sst.aws.Bucket('FrameDrafts', {
	cors: {
		allowMethods: ['POST', 'GET'],
		allowOrigins: [origin],
	},

	transform: {
		bucket(args, opts) {
			args.forceDestroy = undefined;

			switch ($app.stage) {
				case 'luke': {
					args.bucket = imports.luke.frameDraftsBucketName;
					opts.import = imports.luke.frameDraftsBucketName;
					return;
				}
				case 'luke-v3':
					return;
				default:
					throw new Error(`Bucket FrameDrafts import not setup for stage ${$app.stage}`);
			}
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
				runtime: 'nodejs22.x',
			},
		},
	],
});

export const cardDesignBucket = new sst.aws.Bucket('CardDesigns', {
	cors: {
		allowMethods: ['POST', 'GET'],
		allowOrigins: [origin],
	},

	transform: {
		bucket(args, opts) {
			args.forceDestroy = undefined;

			switch ($app.stage) {
				case 'luke': {
					args.bucket = imports.luke.cardDesignsBucketName;
					opts.import = imports.luke.cardDesignsBucketName;
					return;
				}
				case 'luke-v3':
					return;
				default:
					throw new Error(`Bucket FrameDrafts import not setup for stage ${$app.stage}`);
			}
		},
	},
});

export const frameDesignBucket = new sst.aws.Bucket('FrameDesigns', {
	cors: {
		allowMethods: ['POST', 'GET'],
		allowOrigins: [origin],
	},

	transform: {
		bucket(args, opts) {
			args.forceDestroy = undefined;

			switch ($app.stage) {
				case 'luke': {
					args.bucket = imports.luke.frameDesignsBucketName;
					opts.import = imports.luke.frameDesignsBucketName;
					return;
				}
				case 'luke-v3':
					return;
				default:
					throw new Error(`Bucket FrameDrafts import not setup for stage ${$app.stage}`);
			}
		},
	},
});
