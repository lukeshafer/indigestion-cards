import { Config } from 'sst/node/config'
import { Issuer } from 'openid-client'
import { AuthHandler, OauthAdapter } from 'sst/node/future/auth'
import { getAdminUserById } from '@lil-indigestion-cards/core/user'
import { putTokenSecrets } from '@lil-indigestion-cards/core/twitch-helpers'

declare module 'sst/node/future/auth' {
	export interface SessionTypes {
		user: {
			userId: string
			username: string
		}
		admin: {
			userId: string
			username: string
		}
	}
}

export const handler = AuthHandler({
	clients: async () => ({
		local: 'http://localhost:3000',
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
			//console.log(input.tokenset)
			const claims = input.tokenset.claims()

			const adminUser = await getAdminUserById(claims.sub)
			if (!adminUser)
				return {
					type: 'public',
					properties: {},
				}

			return {
				type: 'admin',
				properties: {
					userId: adminUser.userId,
					username: adminUser.username,
				},
			}
		}

		if (input.provider === 'twitchStreamer') {
			const claims = input.tokenset.claims()

			const adminUser = await getAdminUserById(claims.sub)
			if (!adminUser || claims.sub !== Config.STREAMER_USER_ID)
				return {
					type: 'public',
					properties: {},
				}

			if (input.tokenset.access_token && input.tokenset.refresh_token) {
				putTokenSecrets({
					access_token: input.tokenset.access_token,
					refresh_token: input.tokenset.refresh_token,
				})
			}

			return {
				type: 'admin',
				properties: {
					userId: adminUser.userId,
					username: adminUser.username,
				},
			}
		}

		throw new Error('Unknown provider')
	},
	async onError() {
		return {
			statusCode: 400,
			headers: {
				'Content-Type': 'text/plain',
			},
			body: 'Auth failed',
		}
	},
})
