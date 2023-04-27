import { Api, ApiHandler } from 'sst/node/api'
//import { subscribeToTwitchEvent } from '@lil-indigestion-cards/core/twitch-helpers'
import { createSecret, getSecret } from '@lil-indigestion-cards/core/token-management'
import { Config } from 'sst/node/config'

export const handler = ApiHandler(async () => {
	//const callbackUrl = Api.twitchApi.url

	const url = new URL('https://id.twitch.tv/oauth2/authorize')
	url.searchParams.set('response_type', 'code')
	url.searchParams.set('client_id', Config.TWITCH_CLIENT_ID)
	url.searchParams.set('redirect_uri', 'http://localhost:3000/authorize-twitch')

	await createSecret('test', 'Hello, this is a test secret').catch(() => [])

	const secret = await getSecret('test')

	//console.log(secret)

	//const res = await subscribeToTwitchEvent({
	//type: 'channel.subscription.gift',
	//condition: {
	//broadcaster_user_id: '123',
	//},
	//callback: callbackUrl,
	//})
})
