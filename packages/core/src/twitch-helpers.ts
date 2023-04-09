import { Config } from 'sst/node/config'
import crypto from 'crypto'
import { bodySchema, type TwitchBody } from './twitch-event-schemas'
import fetch from 'node-fetch'

export const TWITCH_HEADERS = {
	MESSAGE_TYPE: 'twitch-eventsub-message-type',
	MESSAGE_ID: 'twitch-eventsub-message-id',
	MESSAGE_TIMESTAMP: 'twitch-eventsub-message-timestamp',
	MESSAGE_SIGNATURE: 'twitch-eventsub-message-signature',
	MESSAGE_RETRY: 'twitch-eventsub-message-retry',
	SUBSCRIPTION_TYPE: 'twitch-eventsub-subscription-type',
	SUBSCRIPTION_VERSION: 'twitch-eventsub-subscription-version',
} as const

export const MESSAGE_TYPE = {
	VERIFICATION: 'webhook_callback_verification',
	NOTIFICATION: 'notification',
	REVOCATION: 'revocation',
} as const

interface TwitchRequest {
	headers: Record<string, string | undefined>
	body?: string | undefined
}

export function parseRequestBody(request: unknown): TwitchBody {
	return bodySchema.parse(request)
}

export function verifyDiscordRequest(request: TwitchRequest) {
	try {
		const secret = Config.TWITCH_CLIENT_SECRET
		const message = getHmacMessage(request)
		const hmac = getHmac(secret, message)

		const messageSignature = request.headers[TWITCH_HEADERS.MESSAGE_SIGNATURE]

		if (messageSignature && verifyMessage(hmac, messageSignature)) {
			return true
		}
	} catch {
		return false
	}
	return false
}

function getHmacMessage({ headers, body }: TwitchRequest): string {
	const messageId = headers[TWITCH_HEADERS.MESSAGE_ID]
	const messageTimestamp = headers[TWITCH_HEADERS.MESSAGE_TIMESTAMP]
	const messageBody = body ?? ''

	if (!messageId || !messageTimestamp) {
		throw new Error('Missing message headers')
	}

	const message = messageId + messageTimestamp + messageBody
	return message
}

function getHmac(secret: string, message: string) {
	return `sha256=${crypto.createHmac('sha256', secret).update(message).digest('hex')}`
}

function verifyMessage(hmac: string, verifySignature: string) {
	return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature))
}

export function getHeaders(headers: TwitchRequest['headers']) {
	return {
		messageType: headers[TWITCH_HEADERS.MESSAGE_TYPE],
		messageId: headers[TWITCH_HEADERS.MESSAGE_ID],
		messageTimestamp: headers[TWITCH_HEADERS.MESSAGE_TIMESTAMP],
		messageSignature: headers[TWITCH_HEADERS.MESSAGE_SIGNATURE],
		messageRetry: headers[TWITCH_HEADERS.MESSAGE_RETRY],
		subscriptionType: headers[TWITCH_HEADERS.SUBSCRIPTION_TYPE],
		subscriptionVersion: headers[TWITCH_HEADERS.SUBSCRIPTION_VERSION],
	}
}

export function handleTwitchEvent(body: TwitchBody) {
	switch (body.type) {
		case 'channel.subscription.gift':
			console.log(`${body.event.user_name} gifted ${body.event.total} subscriptions`)
			break
		case 'channel.channel_points_custom_reward_redemption.add':
			body.event
			console.log('Redeemed channel points')
			break
	}
	return { statusCode: 200 }
}

export async function getUserByLogin(login: string) {
	const user = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${Config.TWITCH_ACCESS_TOKEN}`,
		},
	})
	const body = await user.json()
	if (
		!body ||
		!(typeof body === 'object') ||
		!('data' in body) ||
		!body.data ||
		!(body.data instanceof Array) ||
		body.data.length === 0 ||
		typeof body.data[0].id !== 'string'
	) {
		throw new Error('User not found')
	}

	return body.data[0].id as string
}
