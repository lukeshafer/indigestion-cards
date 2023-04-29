import { createAdminUser } from '@lil-indigestion-cards/core/user'
import { ApiHandler, useFormValue } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'
import { getUserByLogin } from '@lil-indigestion-cards/core/twitch-helpers'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const username = useFormValue('username')
	if (!username) return { statusCode: 400, body: 'Missing username' }

	const { display_name, id } = await getUserByLogin(username)

	const result = await createAdminUser({ userId: id, username: display_name })

	return result.success
		? {
			statusCode: 200,
			body: JSON.stringify({
				message: 'User created!',
			}),
		}
		: {
			statusCode: 500,
			body: JSON.stringify({
				message: result.error,
				params: new URLSearchParams({ 'form-username': username }).toString(),
			}),
		}
})
