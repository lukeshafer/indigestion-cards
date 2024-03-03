import { Api, Bucket, use, Config } from 'sst/constructs';
import type { StackContext } from 'sst/constructs';
//import { Sites } from './sites';
//import { getDomainName, getHostedZone } from './constants';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {
	Distribution,
	LambdaEdgeEventType,
	OriginRequestPolicy,
	ViewerProtocolPolicy,
    experimental,
} from 'aws-cdk-lib/aws-cloudfront';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { DesignBucket } from './bucket'
import { Database } from './database';

export function ImageProcessing({ app, stack }: StackContext) {
  const { frameBucket, cardDesignBucket } = use(DesignBucket)
  const db = use(Database)

	const cardsBucket = new Bucket(stack, 'CardsBucket', {
		cdk: {
			bucket: {
				enforceSSL: true,
			},
		},
	});

  const adminImageSecret = new Config.Secret(stack, 'AdminImageSecret');

  const generateImageApi = new Api(stack, "GenerateImageApi", {
    routes: {
      'GET /cards/{designId}/{rarityId}': 'packages/functions/src/image-api.handler'
    },
    defaults: {
      function: {
        bind: [frameBucket, cardDesignBucket, cardsBucket, adminImageSecret, db]
      }
    }
  })

  const redirectCardsEdgeLambda = new experimental.EdgeFunction(stack, "RedirectCardsEdgeLambda", {
    runtime: Runtime.NODEJS_18_X,
    handler: "lambda.handler",
    code: Code.fromAsset("packages/functions/src/edge/redirect-to-image-gen"),
    stackId: app.logicalPrefixedName("redirect-cards-edge-lambda"),
  })

	const cardCDN = new Distribution(stack, 'CardCDN', {
		defaultBehavior: {
			origin: new S3Origin(cardsBucket.cdk.bucket, {
        customHeaders: {
          'x-indi-image-api-url': generateImageApi.url,
        }
      }),
			viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
			originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,

      edgeLambdas: [
        {
          eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
          functionVersion: redirectCardsEdgeLambda.currentVersion,
        }
      ]
		},
	});

  stack.addOutputs({
    CardCDNUrl: cardCDN.domainName,
    ImageApiUrl: generateImageApi.url,
  })

  return { cardCDN, adminImageSecret }
}
