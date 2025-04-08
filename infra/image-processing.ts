import { cardDesignBucket, frameDesignBucket } from './buckets';
import { database } from './database';

const cardsBucket = new sst.aws.Bucket('CardsBucket', {
	transform: {
		bucket(args, opts) {
			args.forceDestroy = undefined;

			switch ($app.stage) {
				case 'luke': {
					args.bucket = 'luke-lil-indigestion-cards-ima-cardsbucketbe9f1931-ev0utsrxziac';
					opts.import = 'luke-lil-indigestion-cards-ima-cardsbucketbe9f1931-ev0utsrxziac';
					return;
				}
				default:
					throw new Error(`Bucket CardsBucket import not setup for stage ${$app.stage}`);
			}
		},
	},
});

const adminImageSecret = new sst.Secret('AdminImageSecret');

const generateImageApi = new sst.aws.ApiGatewayV2('GenerateImageApi');
generateImageApi.route('GET /cards/{designId}/{rarityId}', {
	handler: 'packages/functions/src/image-api.handler',
	link: [frameDesignBucket, cardDesignBucket, cardsBucket, adminImageSecret, database],
	runtime: 'nodejs22.x',
});

