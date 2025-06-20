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

// const js = String.raw;

//
// })
// const redirectCardsEdgeFn = new aws.cloudfront.Function('RedirectCardsEdgeLambda', {
// 	runtime: 'cloudfront-js-2.0',
// 	code: generateImageApi.url.apply(
// 		url => js`async function handler(event) {
//   const cf = event.Records[0].cf;
//   const response = cf.response;
//   console.log(response.status);
//   console.log('Request', cf.request);
//
//   if (Number(response.status) >= 400) {
//     const apiUrlHeader = "${url}";
//     const apiUrl = apiUrlHeader[0].value;
//     const s3Key = cf.request.uri;
//     const query = cf.request.querystring.length > 0 ? '?' + cf.request.querystring : '';
//
//     const location = apiUrl + '/cards' + s3Key + query;
//     console.log('Redirecting', { apiUrl, s3Key, query, location, apiUrlHeader });
//
//     return {
//       status: '302',
//       statusDescription: 'OK',
//       headers: {
//         ...response.headers,
//         'cache-control': [ { key: 'Cache-Control', value: 'no-store' } ],
//         location: [ { key: 'Location', value: location },
//         ],
//       },
//     };
//   }
//   return response;
// }`
// 	),
// 	comment: 'Function to redirect to lambda if card does not exist.',
// });

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
		// functionAssociations: [
		// 	{ eventType: 'viewer-response', functionArn: redirectCardsEdgeFn.arn },
		// ],
	},
	restrictions: { geoRestriction: { restrictionType: 'none' } },
	viewerCertificate: { cloudfrontDefaultCertificate: true },
});

cardsCDN.domainName.apply(console.log);

// const testEdgeLambda = new sst.aws.Function(
// 	'RedirectCardsEdgeLambda',
// 	{
// 		transform: {
// 			function: {
// 				publish: true,
// 				environment: {},
// 			},
// 		},
// 		dev: false,
// 		runtime: 'nodejs22.x',
// 		handler: 'packages/functions/src/edge/redirect-to-image-gen/lambda.handler',
// 	},
// 	{
// 		provider: cardsEdgeFunctionProvider,
// 	}
// );

// testEdgeLambda.nodes.function.environment.apply(console.log);

// const redirectCardsEdgeLambda = new aws.lambda.Function('RedirectCardsEdgeLambda', {
//   runtime: aws.lambda.Runtime.NodeJS22dX,
//
// })

// $concat(testEdgeLambda.arn, ':', testEdgeLambda.nodes.function.version).apply(console.log);

export const cardCDNOld = new sst.aws.Router('CardCDNRouter', {
	// transform: {
	// 	cdn: {
	// 		defaultCacheBehavior: {
	// 			allowedMethods: ['HEAD', 'GET'],
	// 			cachedMethods: ['HEAD', 'GET'],
	// 			targetOriginId: 'default',
	// 			forwardedValues: {
	// 				queryString: true,
	// 				cookies: { forward: 'none' },
	// 			},
	// 			viewerProtocolPolicy: 'redirect-to-https',
	// 			lambdaFunctionAssociations: [
	// 				{ eventType: 'origin-response', lambdaArn: testEdgeLambda.arn },
	// 			],
	// 		},
	// 	},
	// },
	routes: {
		'/*': {
			bucket: cardsBucket,
			// 	edge: {
			// 		viewerResponse: {
			// 			injection: generateImageApi.url.apply(
			// 				url => js`
			// console.log(JSON.stringify(event))
			//   const apiUrl = "${url}";
			//   const s3Key = event.request.uri;
			//   const query = event.request.querystring.length > 0 ? '?' + cf.request.querystring : '';
			//   const location = apiUrl + '/cards' + s3Key + query;
			//   console.log("Generated location: " + location)
			// if (event.response.statusCode >= 400) {
			//   // const apiUrl = "${url}";
			//   // const s3Key = event.request.uri;
			//   // const query = event.request.querystring.length > 0 ? '?' + cf.request.querystring : '';
			//   // const location = apiUrl + '/cards' + s3Key + query;
			//   // console.log("Generated location: ", location)
			//   // return { status: '200', statusDescription: 'OK', body: location}
			// //   return {
			// //     status: '302',
			// //     statusDescription: 'OK',
			// //     headers: Object.assign(response.headers, {
			// //       'cache-control': [ { key: 'Cache-Control', value: 'no-store' } ],
			// //       location: [{ key: 'Location', value: location }],
			// //     }),
			// //   };
			// }`
			// 			),
			// 		},
			// 	},
		},
	},
});
// export const cardCDN = cardCDNOld;
