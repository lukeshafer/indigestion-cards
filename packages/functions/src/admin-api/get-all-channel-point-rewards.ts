import { getAllChannelPointRewards } from '@lil-indigestion-cards/core/twitch-helpers'
import { ApiHandler } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}
})
