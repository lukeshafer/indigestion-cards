import crypto from 'crypto'
import {
	type APIGatewayProxyEventV2,
	type APIGatewayProxyHandlerV2,
} from 'aws-lambda'
import { Config } from 'sst/node/config'
import {
	verifyDiscordRequest,
	parseRequestBody,
	MESSAGE_TYPE,
	TWITCH_HEADERS,
	getHeaders,
} from '@lil-indigestion-cards/core/twitch-helpers'
import {
	checkIfUserExists,
	createNewUser,
	addUnopenedPacks,
} from '@lil-indigestion-cards/core/user'

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

			if (!(await checkIfUserExists(body.event.user_id))) {
				console.log('User does not exist, creating user')
				await createNewUser({
					userId: body.event.user_id,
					userName: body.event.user_name,
				})
			}

			await addUnopenedPacks({
				userId: body.event.user_id,
				packCount: body.event.total,
			})

			console.log(
				`${body.event.user_name} gifted ${body.event.total} subscriptions`
			)
			break
		case 'channel.channel_points_custom_reward_redemption.add':
			body.event
			console.log('Redeemed channel points')
			break
	}
	return { statusCode: 200 }
}
