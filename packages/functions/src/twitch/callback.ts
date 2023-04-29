import { ApiHandler, useDomainName, useQueryParam } from 'sst/node/api'
import { SecretsManager } from 'aws-sdk'
import { Config } from 'sst/node/config'
import {
	getUserAccessToken,
	putTokenSecrets,
	subscribeToTwitchEvent,
} from '@lil-indigestion-cards/core/twitch-helpers'
import { z } from 'zod'

const secretsManager = new SecretsManager()

export const handler = ApiHandler(async (e) => {
	console.log(e)
	const state = useQueryParam('state')
	const storedState = await secretsManager
		.getSecretValue({
			SecretId: Config.STREAMER_AUTH_STATE_ARN,
		})
		.promise()

	if (storedState.SecretString !== state) {
		return {
			statusCode: 400,
			body: 'Invalid state',
		}
	}

	const error = useQueryParam('error')
	if (error) {
		const errorDescription = useQueryParam('error_description')
		return {
			statusCode: 400,
			body: `Error: ${error} - ${errorDescription}`,
		}
	}

	const code = useQueryParam('code')
	if (!code) {
		return {
			statusCode: 400,
			body: 'No code',
		}
	}

	const redirect_uri = 'https://' + useDomainName() + '/twitch/callback'
	const res = await getUserAccessToken({ code, redirect_uri })
	const unparsedBody = await res.json()

	console.log(unparsedBody)

	const body = z
		.object({
			access_token: z.string(),
			refresh_token: z.string(),
			scope: z.array(z.string()),
			token_type: z.string(),
		})
		.parse(unparsedBody)

	const putSecretsPromise = await putTokenSecrets({
		access_token: body.access_token,
		refresh_token: body.refresh_token,
	})

	const subs = [
		subscribeToTwitchEvent({
			type: 'channel.subscription.gift',
			condition: {
				broadcaster_user_id: '144313393',
			},
			callback: `https://${useDomainName()}/`,
		}),
		subscribeToTwitchEvent({
			type: 'channel.channel_points_custom_reward_redemption.add',
			condition: {
				broadcaster_user_id: '144313393',
			},
			callback: `https://${useDomainName()}/`,
		}),
	]

	const result = await Promise.all([putSecretsPromise, subs].flat())
	console.log('results', result)

	return {
		statusCode: 200,
		body: 'Hello, world!',
	}
})
