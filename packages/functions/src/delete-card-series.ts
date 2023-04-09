import { deleteSeriesById } from '@lil-indigestion-cards/core/card'
import { usePathParam, ApiHandler, useQueryParam } from 'sst/node/api'

export const handler = ApiHandler(async () => {
	const id = usePathParam('id')
	if (!id) return { statusCode: 400, body: 'Missing series id' }

	const result = await deleteSeriesById(id)

	return result.success
		? { statusCode: 307, headers: { Location: useQueryParam('redirectUrl') || '/' } }
		: result.error === 'Cannot delete series with existing instances'
		? { statusCode: 400, body: result.error }
		: { statusCode: 500, body: result.error }
})
