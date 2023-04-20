import { deleteRarityById } from '@lil-indigestion-cards/core/card'
import { usePathParam, ApiHandler, useHeader } from 'sst/node/api'
import { deleteS3ObjectByUrl } from '@lil-indigestion-cards/core/utils'
import { useQueryParam } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'user')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const rarityId = usePathParam('id')

	if (!rarityId) return { statusCode: 400, body: 'Missing rarity id' }

	const result = await deleteRarityById(rarityId)

	if (result.success && result.data?.frameUrl) deleteS3ObjectByUrl(result.data.frameUrl)

	const redirectUrl = (message: string) =>
		(useHeader('referer') + 'rarity' || '/') + '?alert=' + message

	const name = useQueryParam('name') ?? rarityId

	return result.success
		? {
				statusCode: 307,
				headers: {
					Location: redirectUrl(`Successfully deleted rarity ${name}&alertType=success`),
				},
		  }
		: {
				statusCode: 307,
				headers: { Location: redirectUrl(result.error ?? '') },
		  }
})
