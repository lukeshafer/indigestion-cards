import { type APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { EventBus } from 'sst/node/event-bus'
import { EventBridge } from 'aws-sdk'
import {
	verifyDiscordRequest,
	parseRequestBody,
	MESSAGE_TYPE,
	getHeaders,
} from '@lil-indigestion-cards/core/twitch-helpers'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
	if (!verifyDiscordRequest(event) || !event.body) {
		console.log('Message not verified')
		return { statusCode: 403 }
	}

	const { messageType } = getHeaders(event.headers)
	const unsafeBody = JSON.parse(event.body) as unknown
	console.log('unsafeBody', unsafeBody)

	if (messageType === MESSAGE_TYPE.VERIFICATION) {
		if (
			!unsafeBody ||
			typeof unsafeBody !== 'object' ||
			!('challenge' in unsafeBody) ||
			typeof unsafeBody.challenge !== 'string'
		) {
			console.log('Invalid verification request')
			return { statusCode: 400 }
		}

		return {
			statusCode: 200,
			body: unsafeBody.challenge,
		}
	}

	if (messageType !== MESSAGE_TYPE.NOTIFICATION) {
		console.log('Invalid message type')
		return { statusCode: 400 }
	}

	const body = parseRequestBody(unsafeBody)

	console.log('Notification received')
	switch (body.type) {
		case 'channel.subscription.gift':
			if (body.event.total < 5) {
				console.log('Gifted less than 5 subscriptions')
				return { statusCode: 200 }
			}

			const totalPacks = Math.floor(body.event.total / 5)

			const eventBridge = new EventBridge()
			await eventBridge
				.putEvents({
					Entries: [
						{
							Source: 'twitch',
							DetailType: 'give-pack-to-user',
							Detail: JSON.stringify({
								userId: body.event.user_id,
								username: body.event.user_name,
								packCount: totalPacks,
							}),
							EventBusName: EventBus.eventBus.eventBusName,
						},
					],
				})
				.promise()
			break
		case 'channel.channel_points_custom_reward_redemption.add':
			body.event
			console.log('Redeemed channel points')
			break
	}
	return { statusCode: 200 }
}
