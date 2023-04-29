import { deleteSeasonById } from '@lil-indigestion-cards/core/card'
import { usePathParam, ApiHandler } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const id = usePathParam('id')
	if (!id)
		return {
			statusCode: 400,
			body: JSON.stringify({ message: 'Missing season id', redirectPath: `/season/${id}` }),
		}

	const result = await deleteSeasonById(id)

	return result.success
		? { statusCode: 200, body: `Successfully deleted season '${result.data?.seasonName ?? id}'` }
		: result.error === 'Cannot delete season with existing designs'
			? {
				statusCode: 400,
				body: JSON.stringify({
					message: 'Cannot delete season with existing designs. Delete card designs first',
					redirectPath: `/season/${id}`,
				}),
			}
			: {
				statusCode: 500,
				body: JSON.stringify({
					message: result.error,
					redirectPath: `/season/${id}`,
				}),
			}
})
