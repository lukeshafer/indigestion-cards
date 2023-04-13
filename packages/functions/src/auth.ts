import { Config } from 'sst/node/config'
import { Issuer } from 'openid-client'
//import { AuthHandler, Session, TwitchAdapter } from 'sst/node/auth'
import { AuthHandler as FutureAuthHandler, OauthAdapter } from 'sst/node/future/auth'
import { useQueryParam, useResponse } from 'sst/node/api'

declare module 'sst/node/future/auth' {
	export interface SessionTypes {
		user: {
			userId: string
		}
	}
}

export const handler = FutureAuthHandler({
	clients: async () => ({
		local: 'http://localhost:3001',
	}),
	providers: {
		twitch: OauthAdapter({
			issuer: await Issuer.discover('https://id.twitch.tv/oauth2'),
			clientID: Config.TWITCH_CLIENT_ID,
			clientSecret: Config.TWITCH_CLIENT_SECRET,
			scope: 'openid',
		}),
	},
	async onAuthorize() {
		const ref = useQueryParam('ref')
		if (ref) {
			useResponse().cookie({
				key: 'ref',
				value: ref,
				httpOnly: true,
				secure: true,
				maxAge: 60 * 10,
				sameSite: 'None',
			})
		}
	},
	async onSuccess(input) {
		if (input.provider === 'twitch') {
			const claims = input.tokenset.claims()

			return {
				type: 'user',
				properties: {
					userId: claims.sub,
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
