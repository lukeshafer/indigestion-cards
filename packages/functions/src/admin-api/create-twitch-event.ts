import { ApiHandler, useFormValue } from 'sst/node/api'
import {
	createTwitchEvent,
	checkIsValidTwitchEventType,
} from '@lil-indigestion-cards/core/site-config'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const eventId = useFormValue('event_id')
	const eventName = useFormValue('event_name')
	const eventType = useFormValue('event_type')
	const packTypeId = useFormValue('pack_type_id')
	const packTypeName = useFormValue('pack_type_name')
	const costString = useFormValue('cost')

	const cost = costString ? parseInt(costString) || undefined : undefined

	if (!eventId || !eventName || !packTypeId || !packTypeName || !eventType) {
		return {
			statusCode: 400,
			body: 'Missing query params',
		}
	}

	if (!checkIsValidTwitchEventType(eventType)) {
		return {
			statusCode: 400,
			body: 'Invalid event type',
		}
	}

	await createTwitchEvent({
		eventId,
		eventName,
		eventType,
		packTypeId,
		packTypeName,
		cost,
	})
})
