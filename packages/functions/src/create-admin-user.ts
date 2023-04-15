import { createAdminUser } from '@lil-indigestion-cards/core/user'
import { ApiHandler, useFormValue, useHeader } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'
import { getUserByLogin } from '@lil-indigestion-cards/core/twitch-helpers'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (!session)
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const username = useFormValue('username')
	if (!username) return { statusCode: 400, body: 'Missing username' }

	const { display_name, id } = await getUserByLogin(username)

	const result = await createAdminUser({ userId: id, username: display_name })

	const urlBase = useHeader('referer') ?? '/'

	return result.success
		? {
				statusCode: 307,
				headers: {
					Location:
						urlBase + 'config?' + new URLSearchParams({ alert: 'User created!', type: 'success' }),
				},
		  }
		: {
				statusCode: 307,
				headers: {
					Location:
						urlBase +
						'create/admin' +
						'?' +
						new URLSearchParams({
							alert: result.error!,
							type: 'error',
							'form-username': username,
						}).toString(),
				},
		  }
})
