import { ApiHandler, useJsonBody } from 'sst/node/api'
import { openCardFromPack } from '@lil-indigestion-cards/core/card'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (!session)
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const { instanceId } = useJsonBody()
	if (!instanceId) return { statusCode: 400, body: 'Missing instanceId.' }

	const result = await openCardFromPack({ instanceId })

	if (!result.success) {
		return {
			statusCode: 500,
			body: 'Unable to open card from pack.',
		}
	}

	return {
		statusCode: 200,
		body: JSON.stringify(result.data),
	}
})
