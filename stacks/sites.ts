import { Fn } from 'aws-cdk-lib'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import { StackContext, AstroSite, use } from 'sst/constructs'
import { Database } from './database'
import { API } from './api'
import { DesignBucket } from './bucket'
import { AuthStack } from './auth'

export function Sites({ stack }: StackContext) {
	const table = use(Database)
	const api = use(API)
	const { frameBucket, cardDesignBucket } = use(DesignBucket)
	const auth = use(AuthStack)

	const adminSite = new AstroSite(stack, 'admin', {
		path: 'packages/admin-site',
		bind: [table, api, frameBucket, cardDesignBucket, auth],
		cdk: {
			distribution: {
				defaultBehavior: {
					origin: new origins.HttpOrigin(Fn.parseDomainName(api.url)),
				},
			},
		},
	})

	// TODO: add cron job to check twitch for users who have updated their username

	stack.addOutputs({
		AdminUrl: adminSite.url,
	})
}
