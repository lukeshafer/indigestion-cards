import { ApiHandler, useFormValue, useHeader } from 'sst/node/api'
import { deleteFirstPackForUser } from '@lil-indigestion-cards/core/card'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (!session)
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const userId = useFormValue('userId')
	const username = useFormValue('username')
	if (!userId) return { statusCode: 400, body: 'Missing userId' }
	if (!username) return { statusCode: 400, body: 'Missing username' }

	const result = await deleteFirstPackForUser({ userId })

	const redirectUrl = new URL(useHeader('referer') ?? 'http://localhost:3000')
	redirectUrl.pathname = `/user/${username}`
	if (!result.success) {
		redirectUrl.searchParams.set('alert', result.error)
		return { statusCode: 302, headers: { Location: redirectUrl.toString() } }
	}

	redirectUrl.searchParams.set('alert', `Revoked 1 pack for ${username}`)
	redirectUrl.searchParams.set('alertType', 'success')
	return { statusCode: 302, headers: { Location: redirectUrl.toString() } }
})
