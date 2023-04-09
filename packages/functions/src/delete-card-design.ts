import { deleteCardDesignById } from '@lil-indigestion-cards/core/card'
import { usePathParam, ApiHandler, useQueryParam } from 'sst/node/api'

export const handler = ApiHandler(async () => {
	const id = usePathParam('id')

	if (!id) return { statusCode: 400, body: 'Missing design id' }

	const result = await deleteCardDesignById(id)
	//const result = { success: true, error: '' }

	const redirectUrl = (message: string) =>
		(useQueryParam('redirectUrl') || '/') + '?message=' + message

	return result.success
		? { statusCode: 307, headers: { Location: redirectUrl(`Successfully deleted card ID ${id}`) } }
		: result.error === 'Cannot delete design with existing instances'
		? { statusCode: 400, body: result.error, headers: { Location: redirectUrl(result.error) } }
		: {
				statusCode: 500,
				body: result.error,
				headers: { Location: redirectUrl(result.error ?? '') },
		  }
})
