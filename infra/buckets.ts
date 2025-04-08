import { getDomainName } from './config';
import { database } from './database';

const origin = $dev === true ? 'http://localhost:4322' : `https://${getDomainName($app.stage)}`;

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
					args.bucket = 'luke-lil-indigestion-car-carddraftsbucket9d9632ed-1ovckttx266wv';
					opts.import = 'luke-lil-indigestion-car-carddraftsbucket9d9632ed-1ovckttx266wv';
					return;
				}
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
					args.bucket = 'luke-lil-indigestion-car-framedraftsbucketc501c32-1blqubr7mthk';
					opts.import = 'luke-lil-indigestion-car-framedraftsbucketc501c32-1blqubr7mthk';
					return;
				}
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
					args.bucket = 'luke-lil-indigestion-car-carddesignsbucketd131504-1rjv2tsi9rm2p';
					opts.import = 'luke-lil-indigestion-car-carddesignsbucketd131504-1rjv2tsi9rm2p';
					return;
				}
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
					args.bucket = 'luke-lil-indigestion-car-framedesignsbucket5220be-1agd7xj3rv4b4';
					opts.import = 'luke-lil-indigestion-car-framedesignsbucket5220be-1agd7xj3rv4b4';
					return;
				}
				default:
					throw new Error(`Bucket FrameDrafts import not setup for stage ${$app.stage}`);
			}
		},
	},
});
