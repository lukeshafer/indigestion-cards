import { Config } from 'sst/node/config'
import { Issuer } from 'openid-client'
import { AuthHandler, OauthAdapter } from 'sst/node/future/auth'
import { getAdminUserById } from '@lil-indigestion-cards/core/user'

declare module 'sst/node/future/auth' {
	export interface SessionTypes {
		user: {
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
		twitch: OauthAdapter({
			issuer: await Issuer.discover('https://id.twitch.tv/oauth2'),
			clientID: Config.TWITCH_CLIENT_ID,
			clientSecret: Config.TWITCH_CLIENT_SECRET,
			scope: 'openid',
		}),
	},
	async onSuccess(input) {
		if (input.provider === 'twitch') {
			const claims = input.tokenset.claims()

			const adminUser = await getAdminUserById(claims.sub)
			if (!adminUser)
				return {
					type: 'public',
					properties: {},
				}

			return {
				type: 'user',
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
