import { ApiHandler, useQueryParams } from 'sst/node/api'
import { EventBus } from 'sst/node/event-bus'
import { EventBridge } from 'aws-sdk'
import { getUserByLogin } from '@lil-indigestion-cards/core/twitch-helpers'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (!session)
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const eventBridge = new EventBridge()

	const { userName, userId: paramUserId, count: rawCount } = useQueryParams()
	if (!userName) return { statusCode: 400, body: 'Missing user id or user name' }
	const userId = paramUserId ?? (await getUserByLogin(userName))

	const count = Number(rawCount) || 1

	try {
		await eventBridge
			.putEvents({
				Entries: [
					{
						Source: 'twitch',
						DetailType: 'give-pack-to-user',
						Detail: JSON.stringify({
							userId: userId,
							username: userName,
							packCount: count,
						}),
						EventBusName: EventBus.eventBus.eventBusName,
					},
				],
			})
			.promise()
	} catch (error) {
		return { statusCode: 500, body: error?.message }
	}
})
