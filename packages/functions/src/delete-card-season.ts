import { deleteSeasonById } from '@lil-indigestion-cards/core/card'
import { usePathParam, ApiHandler, useQueryParam, useHeader } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (!session)
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const id = usePathParam('id')
	if (!id) return { statusCode: 400, body: 'Missing season id' }

	const result = await deleteSeasonById(id)

	const redirectUrl = useQueryParam('redirectUrl') || '/'
	const errorRedirect = `${useHeader('referer') || '/'}season/${id}?alert=`

	return result.success
		? { statusCode: 307, headers: { Location: redirectUrl } }
		: result.error === 'Cannot delete season with existing designs'
			? {
				statusCode: 307,
				body: result.error,
				headers: {
					Location:
						errorRedirect + 'Cannot delete season with existing cards. Delete card designs first',
				},
			}
			: { statusCode: 307, body: result.error, headers: { Location: errorRedirect + result.error } }
})
