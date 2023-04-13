import { createSeason } from '@lil-indigestion-cards/core/card'
import { ApiHandler, useFormValue, useHeader } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async (e) => {
	const session = useSession()
	if (!session)
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	console.log(e)

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

	const redirect = (useHeader('referer') ?? '/') + `season/${seasonId}`

	return result.success
		? { statusCode: 307, headers: { Location: redirect } }
		: result.error === 'Season already exists'
			? { statusCode: 409, body: 'Error: ' + result.error }
			: { statusCode: 500, body: 'Error: ' + result.error }
})
