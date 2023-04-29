import { ApiHandler, useDomainName } from 'sst/node/api'
import { Config } from 'sst/node/config'
import { SecretsManager } from 'aws-sdk'
import crypto from 'crypto'

const secretsManager = new SecretsManager()

export const handler = ApiHandler(async () => {
	const callbackUrl = 'https://' + useDomainName() + '/twitch/callback'

	const state = crypto.randomBytes(16).toString('hex')
	await secretsManager
		.putSecretValue({
			SecretId: Config.STREAMER_AUTH_STATE_ARN,
			SecretString: state,
		})
		.promise()

	const url = new URL('https://id.twitch.tv/oauth2/authorize')
	url.searchParams.set('client_id', Config.TWITCH_CLIENT_ID)
	url.searchParams.set('force_verify', 'true')
	url.searchParams.set('redirect_uri', callbackUrl)
	url.searchParams.set('response_type', 'code')
	url.searchParams.set('scope', 'openid channel:read:redemptions channel:read:subscriptions')
	url.searchParams.set('state', state)

	return {
		statusCode: 302,
		headers: {
			Location: url.toString(),
		},
	}
})
