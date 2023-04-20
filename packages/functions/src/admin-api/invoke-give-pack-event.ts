import { ApiHandler, useFormValue, useHeader } from 'sst/node/api'
import { EventBus } from 'sst/node/event-bus'
import { EventBridge } from 'aws-sdk'
import { getUserByLogin } from '@lil-indigestion-cards/core/twitch-helpers'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'user') {
		console.log(session)
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}
	}

	const eventBridge = new EventBridge()

	const username = useFormValue('username')
	const rawCount = useFormValue('count')
	const paramUserId = useFormValue('userId')
	if (!username) return { statusCode: 400, body: 'Missing user id or user name' }
	const userId = paramUserId ?? (await getUserByLogin(username)).id

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
							username,
							packCount: count,
						}),
						EventBusName: EventBus.eventBus.eventBusName,
					},
				],
			})
			.promise()
	} catch (error) {
		if (error instanceof Error) return { statusCode: 500, body: error?.message }
		return { statusCode: 500, body: 'Unknown error' }
	}

	const redirectUrl = new URL(useHeader('referer') ?? 'http://localhost:3000')
	redirectUrl.pathname = '/give-pack'
	redirectUrl.searchParams.set('alert', `Gave ${count} pack${count > 1 ? 's' : ''} to ${username}`)
	redirectUrl.searchParams.set('alertType', 'success')
	return { statusCode: 302, headers: { Location: redirectUrl.toString() } }
})
