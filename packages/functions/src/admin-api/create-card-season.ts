import { createSeason } from '@lil-indigestion-cards/core/card'
import { ApiHandler, useFormValue } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const seasonName = useFormValue('name')
	const seasonId = useFormValue('seasonId')
	const description = useFormValue('description') ?? undefined

	let errorMessage = ''
	if (!seasonName) errorMessage += 'Missing name. '
	if (!seasonId) errorMessage += 'Missing seasonId. '
	if (!seasonId!.match(/^[a-z0-9-]+$/))
		errorMessage += 'Invalid seasonId. (Must be lowercase, numbers, and dashes only) '
	if (errorMessage) return { statusCode: 400, body: 'Error: ' + errorMessage }

	const result = await createSeason({
		seasonId: seasonId!,
		seasonName: seasonName!,
		seasonDescription: description,
	})

	return result.success
		? {
			statusCode: 200,
			body: JSON.stringify({
				message: 'Season created!',
				redirectPath: `/season/${seasonId}`,
			}),
		}
		: result.error === 'Season already exists'
			? {
				statusCode: 409,
				body: JSON.stringify({
					message: 'Error: ' + result.error,
					params: new URLSearchParams({
						'form-name': seasonName!,
						'form-seasonId': seasonId!,
						'form-description': description ?? '',
					}).toString(),
				}),
			}
			: { statusCode: 500, body: 'Error: ' + result.error }
})
