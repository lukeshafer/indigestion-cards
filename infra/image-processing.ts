import { cardDesignBucket, frameDesignBucket } from './buckets';
import { imports } from './config';
import { database } from './database';

const cardsBucket = new sst.aws.Bucket('CardsBucket', {
	access: 'cloudfront',
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

const cardsEdgeFunctionProvider = new aws.Provider('CardsEdgeFunctionProvider', {
	region: 'us-east-1',
});

const cardsEdgeFunctionRole = new aws.iam.Role(
	'CardsEdgeFunctionRole',
	{
		path: '/service-role/',
		managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
		assumeRolePolicy: {
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'sts:AssumeRole',
					Effect: 'Allow',
					Sid: '',
					Principal: {
						Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
					},
				},
			],
		},
	},
	{ provider: cardsEdgeFunctionProvider }
);

const cardsEdgeFunction = new aws.lambda.Function(
	'CardsEdgeFunction',
	{
		role: cardsEdgeFunctionRole.arn,
		handler: 'lambda.handler',
		code: $asset('packages/functions/src/edge/redirect-to-image-gen'),
		runtime: aws.lambda.Runtime.NodeJS22dX,
		publish: true,
	},
	{ provider: cardsEdgeFunctionProvider }
);

const cardsCDNOriginID = 'cardsCDNOriginID';
export const cardsCDN = new aws.cloudfront.Distribution('CardsCDN', {
	comment: 'Card CDN Distribution (Pulumi)',
	origins: [
		{
			domainName: cardsBucket.nodes.bucket.bucketRegionalDomainName,
			customHeaders: [{ name: 'x-indi-image-api-url', value: generateImageApi.url }],
			originId: cardsCDNOriginID,
		},
	],
	enabled: true,
	isIpv6Enabled: true,
	defaultCacheBehavior: {
		allowedMethods: ['HEAD', 'GET'],
		cachedMethods: ['HEAD', 'GET'],
		targetOriginId: cardsCDNOriginID,
		forwardedValues: {
			queryString: true,
			cookies: { forward: 'none' },
		},
		viewerProtocolPolicy: 'redirect-to-https',
		lambdaFunctionAssociations: [
			{
				eventType: 'origin-response',
				lambdaArn: $concat(cardsEdgeFunction.arn, ':', cardsEdgeFunction.version),
			},
		],
	},
	restrictions: { geoRestriction: { restrictionType: 'none' } },
	viewerCertificate: { cloudfrontDefaultCertificate: true },
});

cardsCDN.domainName.apply(console.log);
