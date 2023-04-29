import { ApiHandler, useFormValue } from 'sst/node/api'
import { deleteFirstPackForUser } from '@lil-indigestion-cards/core/card'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const userId = useFormValue('userId')
	const username = useFormValue('username')
	if (!userId) return { statusCode: 400, body: 'Missing userId' }
	if (!username) return { statusCode: 400, body: 'Missing username' }

	console.log('Revoking pack for', username, userId)
	const result = await deleteFirstPackForUser({ userId })

	if (!result.success) {
		return { statusCode: 400, body: result.error }
	}

	return {
		statusCode: 200,
		body: `Revoked 1 pack for ${username}`,
	}
})
