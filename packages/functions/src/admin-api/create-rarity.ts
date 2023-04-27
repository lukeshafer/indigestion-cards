import { createRarity, deleteUnmatchedDesignImage } from '@lil-indigestion-cards/core/card'
import { ApiHandler, useFormValue } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'user')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const imgUrl = useFormValue('imgUrl')
	const imageKey = useFormValue('imageKey')
	const rarityName = useFormValue('rarityName')
	const rarityId = useFormValue('rarityId')
	const defaultCount = useFormValue('defaultCount')
	const bucket = useFormValue('bucket')

	let errorMessage = ''
	if (!imgUrl) errorMessage += 'Missing imgUrl. '
	if (!imageKey) errorMessage += 'Missing imageKey. '
	if (!rarityName) errorMessage += 'Missing rarityName. '
	if (!rarityId) errorMessage += 'Missing rarityId. '
	if (!defaultCount) errorMessage += 'Missing defaultCount. '
	if (!bucket) errorMessage += 'Missing bucket. '
	if (!rarityId!.match(/^[a-z0-9-]+$/))
		errorMessage += 'Invalid seasonId. (Must be lowercase, numbers, and dashes only) '
	if (errorMessage) return { statusCode: 400, body: 'Error: ' + errorMessage }

	const result = await createRarity({
		rarityId: rarityId!,
		rarityName: rarityName!,
		frameUrl: imgUrl!,
		defaultCount: parseInt(defaultCount!) || 0,
	})

	if (result.success) {
		await deleteUnmatchedDesignImage(imageKey!)
	}

	return result.success
		? {
				statusCode: 200,
				body: JSON.stringify({
					message: `Rarity ${rarityName} created!`,
					redirectPath: '/rarity',
				}),
		  }
		: {
				statusCode: result.error === 'Rarity already exists' ? 409 : 500,
				body: JSON.stringify({
					message:
						result.error === 'Rarity already exists'
							? `Rarity with id ${rarityId} already exists!`
							: result.error,
					params: new URLSearchParams({
						'form-rarityName': rarityName!,
						'form-rarityId': rarityId!,
						'form-defaultCount': defaultCount!,
						bucket: bucket!,
						key: imageKey!,
					}).toString(),
				}),
		  }
})
