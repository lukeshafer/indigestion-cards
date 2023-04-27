import { Config } from 'sst/node/config'
import crypto from 'crypto'
import { bodySchema, type TwitchBody } from './twitch-event-schemas'
import fetch from 'node-fetch'
import { z } from 'zod'
import { Api } from 'sst/node/api'

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
			//
			break
		case 'channel.channel_points_custom_reward_redemption.add':
			body.event
			//
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

	const schema = z.object({
		data: z.array(
			z.object({
				id: z.string(),
				login: z.string(),
				display_name: z.string(),
				profile_image_url: z.string(),
			})
		),
	})

	const result = schema.safeParse(body)

	if (!result.success) {
		throw new Error('User not found')
	}

	return result.data.data[0]
}

const subscriptionsUrl = 'https://api.twitch.tv/helix/eventsub/subscriptions'

interface ChannelSubscriptionGiftEvent {
	type: 'channel.subscription.gift'
	condition: {
		broadcaster_user_id: string
	}
	callback: string
}

interface ChannelPointsCustomRewardRedemptionEvent {
	type: 'channel.channel_points_custom_reward_redemption.add'
	condition: {
		broadcaster_user_id: string
		reward_id: string
	}
	callback: string
}

type TwitchEvent = ChannelSubscriptionGiftEvent | ChannelPointsCustomRewardRedemptionEvent

export async function subscribeToTwitchEvent(event: TwitchEvent) {
	const res = await fetch(subscriptionsUrl, {
		method: 'POST',
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${Config.TWITCH_ACCESS_TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			type: event.type,
			version: '1',
			condition: event.condition,
			transport: {
				method: 'webhook',
				callback: event.callback,
				secret: Config.TWITCH_CLIENT_SECRET,
			},
		}),
	})

	if (!res.ok) {
		return { success: false, statusCode: res.status, body: await res.text() }
	}

	const body = await res.json()

	const bodySchema = z.object({
		data: z.array(
			z.object({
				id: z.string(),
				status: z.string(),
				type: z.string(),
				version: z.string(),
				condition: z.record(z.any()),
				created_at: z.string(),
				transport: z.object({
					method: z.string(),
					callback: z.string(),
				}),
				cost: z.number(),
			})
		),
		total: z.number(),
		total_cost: z.number(),
		max_total_cost: z.number(),
	})

	const result = bodySchema.safeParse(body)

	if (!result.success) {
		console.error(result.error)
		return { success: false, statusCode: res.status, body: body }
	}

	return { success: true, statusCode: res.status, body: result.data }
}
