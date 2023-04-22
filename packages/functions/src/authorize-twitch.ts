import { Api, ApiHandler } from 'sst/node/api'
import { subscribeToTwitchEvent } from '@lil-indigestion-cards/core/twitch-helpers'

export const handler = ApiHandler(async () => {
	const callbackUrl = Api.twitchApi.url
	const res = await subscribeToTwitchEvent({
		type: 'channel.subscription.gift',
		condition: {
			broadcaster_user_id: '123',
		},
		callback: callbackUrl,
	})
})
