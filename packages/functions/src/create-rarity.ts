import { createRarity, deleteUnmatchedDesignImage } from '@lil-indigestion-cards/core/card'
import { ApiHandler, useFormValue, useHeader } from 'sst/node/api'

export const handler = ApiHandler(async (e) => {
	console.log(e)

	const imgUrl = useFormValue('imgUrl')
	const imageKey = useFormValue('imageKey')
	const rarityName = useFormValue('rarityName')
	const rarityId = useFormValue('rarityId')

	let errorMessage = ''
	if (!imgUrl) errorMessage += 'Missing imgUrl. '
	if (!imageKey) errorMessage += 'Missing imageKey. '
	if (!rarityName) errorMessage += 'Missing rarityName. '
	if (!rarityId) errorMessage += 'Missing rarityId. '
	if (!rarityId!.match(/^[a-z0-9-]+$/))
		errorMessage += 'Invalid seasonId. (Must be lowercase, numbers, and dashes only) '
	if (errorMessage) return { statusCode: 400, body: 'Error: ' + errorMessage }

	const result = await createRarity({
		rarityId: rarityId!,
		rarityName: rarityName!,
		frameUrl: imgUrl!,
	})

	if (result.success) {
		await deleteUnmatchedDesignImage(imageKey!)
	}

	const redirect = (useHeader('referer') ?? '/') + `rarities`

	return result.success
		? { statusCode: 307, headers: { Location: redirect } }
		: result.error === 'Rarity already exists'
			? { statusCode: 409, body: 'Error: ' + result.error }
			: { statusCode: 500, body: 'Error: ' + result.error }
})
