import { Config } from 'sst/node/config';
import crypto from 'crypto';
import { bodySchema, type TwitchBody, customRewardResponse } from './twitch-event-schemas';
import fetch from 'node-fetch';
import { SecretsManager } from 'aws-sdk';
import { z } from 'zod';
import { Api } from 'sst/node/api';

const secretsManager = new SecretsManager();

export const TWITCH_HEADERS = {
	MESSAGE_TYPE: 'twitch-eventsub-message-type',
	MESSAGE_ID: 'twitch-eventsub-message-id',
	MESSAGE_TIMESTAMP: 'twitch-eventsub-message-timestamp',
	MESSAGE_SIGNATURE: 'twitch-eventsub-message-signature',
	MESSAGE_RETRY: 'twitch-eventsub-message-retry',
	SUBSCRIPTION_TYPE: 'twitch-eventsub-subscription-type',
	SUBSCRIPTION_VERSION: 'twitch-eventsub-subscription-version',
} as const;

export const MESSAGE_TYPE = {
	VERIFICATION: 'webhook_callback_verification',
	NOTIFICATION: 'notification',
	REVOCATION: 'revocation',
} as const;

interface TwitchRequest {
	headers: Record<string, string | undefined>;
	body?: string | undefined;
}

export const SUBSCRIPTION_TYPE = {
	GIFT_SUB: 'channel.subscription.gift',
	REDEEM_REWARD: 'channel.channel_points_custom_reward_redemption.add',
	ADD_REWARD: 'channel.channel_points_custom_reward.add',
	UPDATE_REWARD: 'channel.channel_points_custom_reward.update',
	REMOVE_REWARD: 'channel.channel_points_custom_reward.remove',
} as const;

export type SubscriptionType = (typeof SUBSCRIPTION_TYPE)[keyof typeof SUBSCRIPTION_TYPE];

export function parseRequestBody(request: unknown): TwitchBody {
	return bodySchema.parse(request);
}

export function verifyDiscordRequest(request: TwitchRequest) {
	try {
		const secret = Config.TWITCH_CLIENT_SECRET;
		const message = getHmacMessage(request);
		const hmac = getHmac(secret, message);

		const messageSignature = request.headers[TWITCH_HEADERS.MESSAGE_SIGNATURE];

		if (messageSignature && verifyMessage(hmac, messageSignature)) {
			return true;
		}
	} catch {
		return false;
	}
	return false;
}

function getHmacMessage({ headers, body }: TwitchRequest): string {
	const messageId = headers[TWITCH_HEADERS.MESSAGE_ID];
	const messageTimestamp = headers[TWITCH_HEADERS.MESSAGE_TIMESTAMP];
	const messageBody = body ?? '';

	if (!messageId || !messageTimestamp) {
		throw new Error('Missing message headers');
	}

	const message = messageId + messageTimestamp + messageBody;
	return message;
}

function getHmac(secret: string, message: string) {
	return `sha256=${crypto.createHmac('sha256', secret).update(message).digest('hex')}`;
}

function verifyMessage(hmac: string, verifySignature: string) {
	return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature));
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
	};
}

export function handleTwitchEvent(body: TwitchBody) {
	switch (body.type) {
		case SUBSCRIPTION_TYPE.GIFT_SUB:
			break;
		case SUBSCRIPTION_TYPE.REDEEM_REWARD:
			body.event;
			break;
	}
	return { statusCode: 200 };
}

export async function getUserByLogin(login: string) {
	const user = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${Config.TWITCH_ACCESS_TOKEN}`,
		},
	});
	const body = await user.json();

	const schema = z.object({
		data: z.array(
			z
				.object({
					id: z.string(),
					login: z.string(),
					display_name: z.string(),
					profile_image_url: z.string(),
				})
				.optional()
		),
	});

	const result = schema.safeParse(body);

	if (!result.success) {
		throw new Error('User not found');
	}

	return result.data.data[0];
}

export type ChannelPointReward = Awaited<ReturnType<typeof getAllChannelPointRewards>>[0];
export async function getAllChannelPointRewards(args: { userId: string }) {
	const { access_token, refresh_token } = await retrieveTokenSecrets();

	if (!access_token || !refresh_token) {
		throw new Error('Missing token secrets');
	}

	const url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
	url.searchParams.set('broadcaster_id', args.userId);
	let twitchResponse = await fetch(url.toString(), {
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${access_token}`,
		},
	});

	if (twitchResponse.status === 401) {
		// token may have expired, try refreshing
		const newToken = await refreshUserAccessToken({ refresh_token });
		if (!newToken) {
			throw new Error('Failed to refresh token');
		}
		const putResults = await putTokenSecrets(newToken);
		twitchResponse = await fetch(url.toString(), {
			headers: {
				'Client-ID': Config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${newToken.access_token}`,
			},
		});
		if (!twitchResponse.ok) {
			throw new Error('Failed to fetch rewards');
		}
	}

	const body = await twitchResponse.json();
	const result = customRewardResponse.safeParse(body);

	if (!result.success) {
		console.error(body);
		throw new Error('Failed to parse rewards');
	}

	return result.data.data;
}

const subscriptionsUrl = 'https://api.twitch.tv/helix/eventsub/subscriptions';

interface ChannelSubscriptionGiftEvent {
	type: typeof SUBSCRIPTION_TYPE.GIFT_SUB;
	condition: {
		broadcaster_user_id: string;
	};
	callback: string;
}

interface ChannelPointsCustomRewardRedemptionEvent {
	type: typeof SUBSCRIPTION_TYPE.REDEEM_REWARD;
	condition: {
		broadcaster_user_id: string;
	};
	callback: string;
}

interface ChannelPointsCustomRewardAddEvent {
	type: typeof SUBSCRIPTION_TYPE.ADD_REWARD;
	condition: {
		broadcaster_user_id: string;
	};
	callback: string;
}

interface ChannelPointsCustomRewardUpdateEvent {
	type: typeof SUBSCRIPTION_TYPE.UPDATE_REWARD;
	condition: {
		broadcaster_user_id: string;
	};
	callback: string;
}

interface ChannelPointsCustomRewardRemoveEvent {
	type: typeof SUBSCRIPTION_TYPE.REMOVE_REWARD;
	condition: {
		broadcaster_user_id: string;
	};
	callback: string;
}

export type TwitchEvent =
	| ChannelSubscriptionGiftEvent
	| ChannelPointsCustomRewardRedemptionEvent
	| ChannelPointsCustomRewardAddEvent
	| ChannelPointsCustomRewardUpdateEvent
	| ChannelPointsCustomRewardRemoveEvent;

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
	});

	if (!res.ok) {
		return { success: false, statusCode: res.status, body: await res.text() };
	}

	const body = await res.json();

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
	});

	const result = bodySchema.safeParse(body);

	if (!result.success) {
		console.error(result.error);
		return { success: false, statusCode: res.status, body: body };
	}

	return { success: true, statusCode: res.status, body: result.data };
}

export async function getUserAccessToken(args: { code: string; redirect_uri: string }) {
	return fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: Config.TWITCH_CLIENT_ID,
			client_secret: Config.TWITCH_CLIENT_SECRET,
			code: args.code,
			grant_type: 'authorization_code',
			redirect_uri: args.redirect_uri,
		}).toString(),
	});
}

async function refreshUserAccessToken(args: { refresh_token: string }) {
	const response = await fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: Config.TWITCH_CLIENT_ID,
			client_secret: Config.TWITCH_CLIENT_SECRET,
			refresh_token: args.refresh_token,
			grant_type: 'refresh_token',
		}).toString(),
	});

	const rawBody = await response.json();
	const bodySchema = z.object({
		access_token: z.string(),
		refresh_token: z.string(),
	});
	const result = bodySchema.safeParse(rawBody);
	if (!result.success) {
		throw new Error('Failed to refresh token');
	}
	return result.data;
}

export async function retrieveTokenSecrets() {
	const getAccessTokenPromise = secretsManager
		.getSecretValue({
			SecretId: Config.STREAMER_ACCESS_TOKEN_ARN,
		})
		.promise();

	const getRefreshTokenPromise = secretsManager
		.getSecretValue({
			SecretId: Config.STREAMER_REFRESH_TOKEN_ARN,
		})
		.promise();

	const [accessToken, refreshToken] = await Promise.all([
		getAccessTokenPromise,
		getRefreshTokenPromise,
	]);

	return {
		access_token: accessToken.SecretString,
		refresh_token: refreshToken.SecretString,
	};
}

export async function putTokenSecrets(args: { access_token: string; refresh_token: string }) {
	const putAccessTokenPromise = secretsManager
		.putSecretValue({
			SecretId: Config.STREAMER_ACCESS_TOKEN_ARN,
			SecretString: args.access_token,
		})
		.promise();

	const putRefreshTokenPromise = secretsManager
		.putSecretValue({
			SecretId: Config.STREAMER_REFRESH_TOKEN_ARN,
			SecretString: args.refresh_token,
		})
		.promise();

	return Promise.all([putAccessTokenPromise, putRefreshTokenPromise]);
}

export async function getActiveTwitchEventSubscriptions() {
	const fetchUrl = new URL('https://api.twitch.tv/helix/eventsub/subscriptions');
	fetchUrl.searchParams.append('user_id', Config.STREAMER_USER_ID);
	const response = await fetch(fetchUrl.toString(), {
		method: 'GET',
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${Config.TWITCH_ACCESS_TOKEN}`,
		},
	});

	if (!response.ok) {
		throw new Error('Failed to fetch subscriptions');
	}

	const body = await response.json();
	const subscriptionSchema = z.object({
		data: z.array(
			z.object({
				id: z.string(),
				status: z.string(),
				type: z.enum([
					'channel.subscription.gift',
					'channel.channel_points_custom_reward_redemption.add',
					'channel.channel_points_custom_reward.add',
					'channel.channel_points_custom_reward.update',
					'channel.channel_points_custom_reward.remove',
				]),
				condition: z.record(z.string().or(z.number())),
				transport: z.object({
					method: z.string(),
					callback: z.string(),
				}),
			})
		),
		total: z.number(),
		total_cost: z.number(),
		max_total_cost: z.number(),
		pagination: z.object({
			cursor: z.string().optional(),
		}),
	});

	const result = subscriptionSchema.safeParse(body);
	if (!result.success) {
		throw new Error('Failed to parse subscriptions');
	}
	const subscriptions = result.data.data;
	return subscriptions;
}
