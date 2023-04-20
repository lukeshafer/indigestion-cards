import { deleteCardDesignById } from '@lil-indigestion-cards/core/card'
import { usePathParam, ApiHandler, useQueryParam } from 'sst/node/api'
import { deleteS3ObjectByUrl } from '@lil-indigestion-cards/core/utils'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'user')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const designId = usePathParam('designId')
	const seasonId = usePathParam('seasonId')

	if (!designId) return { statusCode: 400, body: 'Missing design id' }
	if (!seasonId) return { statusCode: 400, body: 'Missing season id' }

	const result = await deleteCardDesignById({ designId, seasonId })

	if (result.success && result.data?.imgUrl) deleteS3ObjectByUrl(result.data.imgUrl)

	const redirectUrl = (message: string) =>
		(useQueryParam('redirectUrl') || '/') + '?message=' + message

	return result.success
		? {
				statusCode: 307,
				headers: {
					Location: redirectUrl(`Successfully deleted card '${result.data?.cardName ?? designId}'`),
				},
		  }
		: result.error === 'Cannot delete design with existing instances'
		? { statusCode: 400, body: result.error, headers: { Location: redirectUrl(result.error) } }
		: {
				statusCode: 500,
				body: result.error,
				headers: { Location: redirectUrl(result.error ?? '') },
		  }
})
