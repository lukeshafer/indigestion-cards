import { Config } from 'sst/node/config'
import { AuthHandler, Session, TwitchAdapter } from 'sst/node/auth'

declare module 'sst/node/auth' {
	export interface SessionTypes {
		user: {
			userId: string
		}
	}
}

export const handler = AuthHandler({
	providers: {
		twitch: TwitchAdapter({
			clientID: Config.TWITCH_CLIENT_ID,
			onSuccess: async (tokenset) => {
				const claims = tokenset.claims()
				console.log(claims)

				return Session.cookie({
					redirect: 'http://localhost:3000',
					type: 'user',
					properties: {
						userId: claims.sub,
					},
				})
			},
		}),
	},
})
