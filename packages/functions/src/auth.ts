import { Config } from 'sst/node/config';
import { Issuer } from 'openid-client';
import { EventBus } from 'sst/node/event-bus';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { AuthHandler, OauthAdapter } from 'sst/node/future/auth';
import { getAdminUserById } from '@lil-indigestion-cards/core/user';
import { setTwitchTokens } from '@lil-indigestion-cards/core/twitch-helpers';

declare module 'sst/node/future/auth' {
	export interface SessionTypes {
		user: {
			userId: string;
			username: string;
		};
		admin: {
			userId: string;
			username: string;
		};
	}
}

export const handler = AuthHandler({
	clients: async () => ({
		local: 'http://localhost:3000',
		main: `https://${Config.DOMAIN_NAME}`,
	}),
	providers: {
		twitchStreamer: OauthAdapter({
			issuer: await Issuer.discover('https://id.twitch.tv/oauth2'),
			clientID: Config.TWITCH_CLIENT_ID,
			clientSecret: Config.TWITCH_CLIENT_SECRET,
			scope: 'openid channel:read:redemptions channel:read:subscriptions',
		}),
		twitchUser: OauthAdapter({
			issuer: await Issuer.discover('https://id.twitch.tv/oauth2'),
			clientID: Config.TWITCH_CLIENT_ID,
			clientSecret: Config.TWITCH_CLIENT_SECRET,
			scope: 'openid',
		}),
	},
	async onSuccess(input) {
		if (input.provider === 'twitchUser') {
			const claims = input.tokenset.claims();

			const adminUser = await getAdminUserById(claims.sub);

			if (!adminUser)
				return {
					type: 'session',
					properties: {
						type: 'public',
						properties: {},
					},
				};

			return {
				type: 'session',
				properties: {
					type: 'admin',
					properties: {
						userId: adminUser.userId,
						username: adminUser.username,
					},
				},
			};
		}

		if (input.provider === 'twitchStreamer') {
			const claims = input.tokenset.claims();

			const adminUser = await getAdminUserById(claims.sub);
			if (!adminUser || claims.sub !== Config.STREAMER_USER_ID)
				return {
					type: 'session',
					properties: {
						type: 'public',
						properties: {},
					},
				};

			if (input.tokenset.access_token && input.tokenset.refresh_token) {
				await setTwitchTokens({
					streamer_access_token: input.tokenset.access_token,
					streamer_refresh_token: input.tokenset.refresh_token,
				});
			}

			const eventBridge = new EventBridge();
			await eventBridge.putEvents({
				Entries: [
					{
						Source: 'auth',
						DetailType: 'refresh-channel-point-rewards',
						Detail: JSON.stringify({}),
						EventBusName: EventBus.eventBus.eventBusName,
					},
				],
			});

			return {
				type: 'session',
				properties: {
					type: 'admin',
					properties: {
						userId: adminUser.userId,
						username: adminUser.username,
					},
				},
			};
		}

		throw new Error('Unknown provider');
	},
	async onError() {
		return {
			statusCode: 400,
			headers: {
				'Content-Type': 'text/plain',
			},
			body: 'Auth failed',
		};
	},
});
