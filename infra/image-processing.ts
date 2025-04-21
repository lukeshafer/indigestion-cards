import { cardDesignBucket, frameDesignBucket } from './buckets';
import { imports } from './config';
import { database } from './database';

const cardsBucket = new sst.aws.Bucket('CardsBucket', {
	transform: {
		bucket(args, opts) {
			args.forceDestroy = undefined;

			switch ($app.stage) {
				case 'luke': {
					args.bucket = imports.luke.cardsCDNBucketName;
					opts.import = imports.luke.cardsCDNBucketName;
					return;
				}
				case 'luke-v3':
					return;
				default:
					throw new Error(`Bucket CardsBucket import not setup for stage ${$app.stage}`);
			}
		},
	},
});

export const adminImageSecret = new sst.Secret('AdminImageSecret');

const generateImageApi = new sst.aws.ApiGatewayV2('GenerateImageApi');
generateImageApi.route('GET /cards/{designId}/{rarityId}', {
	handler: 'packages/functions/src/image-api.handler',
	link: [frameDesignBucket, cardDesignBucket, cardsBucket, adminImageSecret, database],
	runtime: 'nodejs22.x',
});

let js = String.raw;
export const cardCDN = new sst.aws.Router('CardCDN', {
	routes: {
		'/': {
			bucket: cardsBucket,
			edge: {
				viewerRequest: {
					injection: js`event.response.headers["x-indi-image-api-url"] = "${generateImageApi.url}";`,
				},
				viewerResponse: {
					injection: js`
            const cf = event.Records[0].cf;
            const response = cf.response;
            console.log(response.status);
            console.log('Request', cf.request);

            if (Number(response.status) >= 400) {
              const apiUrlHeader = cf.request.headers['x-indi-image-api-url'];
              const apiUrl = apiUrlHeader[0].value;
              const s3Key = cf.request.uri;
              const query = cf.request.querystring.length > 0 ? '?' + cf.request.querystring : '';

              const location = apiUrl + '/cards' + s3Key + query;
              console.log('Redirecting', { apiUrl, s3Key, query, location, apiUrlHeader });

              return {
                status: '302',
                statusDescription: 'OK',
                headers: {
                  ...response.headers,
                  'cache-control': [ { key: 'Cache-Control', value: 'no-store' } ],
                  location: [ { key: 'Location', value: location },
                  ],
                },
              };
            }
          `,
				},
			},
		},
	},
});
