import { Config } from 'sst/node/config';
import crypto from 'crypto';
import { bodySchema, type TwitchBody, customRewardResponse } from './twitch-schemas';
import fetch from 'node-fetch';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { z } from 'zod';

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
	} catch (e) {
		console.error(e);
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

export async function getListOfTwitchUsersByIds(ids: string[]) {
	const appAccessToken = (await getTwitchTokens()).app_access_token;
	const fetchUrl = `https://api.twitch.tv/helix/users?id=${ids.join('&id=')}`;
	let response = await fetch(fetchUrl, {
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${appAccessToken}`,
		},
	});

	if (!response.ok) {
		if (response.status !== 401) {
			console.error(response, await response.text());
			throw new Error('Failed to get user from Twitch');
		}

		const newToken = await refreshAppAccessToken();
		response = await fetch(fetchUrl, {
			method: 'GET',
			headers: {
				'Client-ID': Config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${newToken}`,
			},
		});
	}

	const json = await response.json();

	const schema = z.object({
		data: z.array(
			z.object({
				id: z.string(),
				login: z.string(),
				display_name: z.string(),
				profile_image_url: z.string(),
			})
		),
	});

	const parsed = schema.safeParse(json);

	if (!parsed.success) {
		console.error(parsed.error);
		throw new Error('Failed to parse Twitch response');
	}

	return parsed.data.data;
}

export type TwitchUser = NonNullable<Awaited<ReturnType<typeof getUserByLogin>>>;
export async function getUserByLogin(login: string) {
	console.log('Getting Twitch user by login: ', login);
	const appAccessToken = (await getTwitchTokens()).app_access_token;
	const fetchUrl = `https://api.twitch.tv/helix/users?login=${login}`;
	let response = await fetch(fetchUrl, {
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${appAccessToken}`,
		},
	});

	if (!response.ok) {
		if (response.status !== 401) {
			console.error(response, await response.text());
			throw new Error('Failed to get user from Twitch');
		}

		const newToken = await refreshAppAccessToken();
		response = await fetch(fetchUrl, {
			method: 'GET',
			headers: {
				'Client-ID': Config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${newToken}`,
			},
		});

		if (!response.ok) {
			console.error(response, await response.text());
			throw new Error('Failed to get user from Twitch');
		}
	}

	const body = await response.json();

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
	const { streamer_access_token, streamer_refresh_token } = await getTwitchTokens();

	if (!streamer_access_token || !streamer_refresh_token) {
		throw new Error('Missing token secrets');
	}

	const url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
	url.searchParams.set('broadcaster_id', args.userId);
	let twitchResponse = await fetch(url.toString(), {
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${streamer_access_token}`,
		},
	});

	if (twitchResponse.status === 401) {
		// token may have expired, try refreshing
		const newToken = await refreshUserAccessToken({ refresh_token: streamer_refresh_token });
		if (!newToken) {
			throw new Error('Failed to refresh user access token');
		}
		await setTwitchTokens({
			streamer_access_token: newToken.access_token,
		});
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
	const appAccessToken = (await getTwitchTokens()).app_access_token;
	let response = await fetch(subscriptionsUrl, {
		method: 'POST',
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${appAccessToken}`,
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

	if (!response.ok) {
		if (response.status !== 401) {
			const text = await response.text();
			console.error(response, text);
			return { success: false, statusCode: response.status, body: text };
		}

		const newToken = await refreshAppAccessToken();
		response = await fetch(subscriptionsUrl, {
			method: 'POST',
			headers: {
				'Client-ID': Config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${newToken}`,
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

		if (!response.ok) {
			const text = await response.text();
			console.error(response, text);
			return { success: false, statusCode: response.status, body: text };
		}
	}

	if (!response.ok) {
		return { success: false, statusCode: response.status, body: await response.text() };
	}

	const body = await response.json();

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
		return { success: false, statusCode: response.status, body: body };
	}

	return { success: true, statusCode: response.status, body: result.data };
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

	if (!response.ok) {
		console.error(response);
		throw new Error('Failed to refresh user access token');
	}

	const rawBody = await response.json();

	const bodySchema = z.object({
		access_token: z.string(),
		refresh_token: z.string(),
	});
	const result = bodySchema.safeParse(rawBody);
	if (!result.success) {
		console.error(result.error);
		throw new Error('Failed to refresh user access token');
	}

	await setTwitchTokens({ streamer_access_token: result.data.access_token, streamer_refresh_token: result.data.refresh_token });
	return result.data;
}

const twitchTokens = z.object({
	streamer_access_token: z.string(),
	streamer_refresh_token: z.string(),
	app_access_token: z.string(),
});

export async function setTwitchTokens(args: Partial<z.infer<typeof twitchTokens>>) {
	const currentTokens = await getTwitchTokens().catch(() => ({}));
	const newTokens = {
		...currentTokens,
		...args,
	};

	return secretsManager.putSecretValue({
		SecretId: Config.TWITCH_TOKENS_ARN,
		SecretString: JSON.stringify(newTokens),
	});
}

export async function getTwitchTokens() {
	const secret = await secretsManager.getSecretValue({
		SecretId: Config.TWITCH_TOKENS_ARN,
	});

	try {
		const result = twitchTokens.parse(JSON.parse(secret.SecretString || '{}'));
		return result;
	} catch (error) {
		await secretsManager.putSecretValue({
			SecretId: Config.TWITCH_TOKENS_ARN,
			SecretString: JSON.stringify({
				app_access_token: '',
				streamer_access_token: '',
				streamer_refresh_token: '',
			} satisfies z.infer<typeof twitchTokens>),
		});
		console.error(error);
		throw new Error('Failed to parse Twitch tokens');
	}
}

async function refreshAppAccessToken() {
	const newAppAccessToken = await getNewAppAccessToken();
	await setTwitchTokens({ app_access_token: newAppAccessToken });
	return newAppAccessToken;
}

async function getNewAppAccessToken() {
	const response = await fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: Config.TWITCH_CLIENT_ID,
			client_secret: Config.TWITCH_CLIENT_SECRET,
			grant_type: 'client_credentials',
		}).toString(),
	});

	const rawBody = await response.json();
	const bodySchema = z.object({
		access_token: z.string(),
		token_type: z.literal('bearer'),
	});
	const result = bodySchema.safeParse(rawBody);
	if (!result.success) {
		console.error(JSON.stringify(result.error, null, 2));
		throw new Error('Failed to refresh app access token');
	}
	return result.data.access_token;
}

export async function getActiveTwitchEventSubscriptions() {
	const appAccessToken = (await getTwitchTokens()).app_access_token;
	const fetchUrl = new URL('https://api.twitch.tv/helix/eventsub/subscriptions');
	fetchUrl.searchParams.append('user_id', Config.STREAMER_USER_ID);
	let response = await fetch(fetchUrl.toString(), {
		method: 'GET',
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${appAccessToken}`,
		},
	});

	if (!response.ok) {
		if (response.status !== 401) {
			console.error(response, await response.text());
			throw new Error('Failed to fetch subscriptions');
		}

		const newToken = await refreshAppAccessToken();
		response = await fetch(fetchUrl.toString(), {
			method: 'GET',
			headers: {
				'Client-ID': Config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${newToken}`,
			},
		});

		if (!response.ok) {
			console.error(response, await response.text());
			throw new Error('Failed to fetch subscriptions');
		}
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

export async function deleteTwitchEventSubscription(id: string) {
	const appAccessToken = (await getTwitchTokens()).app_access_token;
	const fetchUrl = new URL('https://api.twitch.tv/helix/eventsub/subscriptions');
	fetchUrl.searchParams.append('id', id);

	return fetch(fetchUrl.toString(), {
		method: 'DELETE',
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${appAccessToken}`,
		},
	}).then(async (res) => {
		if (res.ok) return res;
		if (res.status !== 401) {
			console.error(res, await res.text());
			throw new Error('Failed to fetch subscriptions');
		}

		const newToken = await refreshAppAccessToken();
		const newResponse = await fetch(fetchUrl.toString(), {
			method: 'DELETE',
			headers: {
				'Client-ID': Config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${newToken}`,
			},
		});

		if (!newResponse.ok) {
			console.error(res, await newResponse.text());
			throw new Error('Failed to fetch subscriptions');
		}

		return newResponse;
	});
}

export async function getTwitchChatters(cursor?: string): Promise<z.infer<typeof chattersSchema>['data']> {
	const { streamer_access_token, streamer_refresh_token } = await getTwitchTokens();
	const fetchUrl = new URL('https://api.twitch.tv/helix/chat/chatters');
	fetchUrl.searchParams.append('broadcaster_id', Config.STREAMER_USER_ID);
	fetchUrl.searchParams.append('moderator_id', Config.STREAMER_USER_ID);
	if (cursor) fetchUrl.searchParams.append('after', cursor);
	let response = await fetch(fetchUrl.toString(), {
		method: 'GET',
		headers: {
			'Client-ID': Config.TWITCH_CLIENT_ID,
			Authorization: `Bearer ${streamer_access_token}`,
		},
	});

	if (!response.ok) {
		if (response.status !== 401) {
			console.error(response, await response.text());
			throw new Error('Failed to fetch chatters');
		}

		const newToken = await refreshUserAccessToken({ refresh_token: streamer_refresh_token });
		response = await fetch(fetchUrl.toString(), {
			method: 'GET',
			headers: {
				'Client-ID': Config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${newToken.access_token}`,
			},
		});

		if (!response.ok) {
			console.error(response, await response.text());
			throw new Error('Failed to fetch chatters after token refresh');
		}
	}

	const body = await response.json();
	const chattersSchema = z.object({
		data: z.array(
			z.object({
				user_id: z.string(),
				user_login: z.string(),
				user_name: z.string(),
			})
		),
		total: z.number(),
		pagination: z.object({
			cursor: z.string().optional(),
		}),
	});

	const result = chattersSchema.safeParse(body);
	if (!result.success) {
		console.error(result.error);
		throw new Error('Failed to parse chatters');
	}

	const { data, pagination } = result.data;
	if (pagination?.cursor) {
		const nextChatters = await getTwitchChatters(pagination.cursor);
		return [...data, ...nextChatters];
	}

	return data;
}
