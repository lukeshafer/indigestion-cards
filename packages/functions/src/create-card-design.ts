import {
	createCardDesign,
	deleteUnmatchedDesignImage,
	getAllRarities,
} from '@lil-indigestion-cards/core/card'
import { parseS3Url } from '@lil-indigestion-cards/core/utils'
import { ApiHandler, useFormValue, useHeader, useFormData } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (!session)
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const rarities = await getAllRarities()

	const imgUrl = useFormValue('imgUrl')
	const imageKey = useFormValue('imageKey')
	const seasonId = useFormValue('seasonId')
	const cardName = useFormValue('cardName')
	const cardDescription = useFormValue('cardDescription')
	const artist = useFormValue('artist')
	const designId = useFormValue('designId')

	const rarityDetails = rarities.map(({ rarityId, rarityName, frameUrl }) => {
		const count = useFormValue(`rarity-${rarityId}-count`)
		return {
			rarityId,
			rarityName,
			frameUrl,
			count: count ? parseInt(count) : 0,
		}
	})

	const errors = []
	if (!imgUrl) errors.push('Image URL is required')
	if (!imageKey) errors.push('Image key is required')
	if (!seasonId) errors.push('Season ID is required')
	if (!cardName) errors.push('Card name is required')
	if (!cardDescription) errors.push('Card description is required')
	if (!artist) errors.push('Artist is required')
	if (!designId) errors.push('Design ID is required')

	if (errors.length) {
		return { statusCode: 400, body: errors.join(', ') }
	}

	const result = await createCardDesign({
		seasonId: seasonId!,
		cardName: cardName!,
		cardDescription: cardDescription!,
		artist: artist!,
		designId: designId!,
		imgUrl: imgUrl!,
		rarityDetails,
	})

	if (result.success) {
		await deleteUnmatchedDesignImage(imageKey!)
	}

	const referer = useHeader('referer') ?? '/'
	const { Bucket, Key } = parseS3Url(imgUrl!)

	if (result.success) {
		const url = new URL(referer)
		url.searchParams.set('alert', 'Successfully created.')
		url.searchParams.set('type', 'success')
		url.pathname = `/design/${seasonId}/${designId}`
		return {
			statusCode: 307,
			headers: {
				Location: url.toString(),
			},
		}
	}

	const errorMessage =
		result.error === 'Design already exists'
			? `Card design with id '${designId}' already exists. Please choose a different id.`
			: result.error

	const url = new URL(referer)
	url.searchParams.set('alert', errorMessage)
	url.searchParams.set('type', 'error')
	url.pathname = `/create/card-design-details`
	url.searchParams.set('bucket', Bucket)
	url.searchParams.set('key', Key)
	useFormData()?.forEach((value, key) => {
		url.searchParams.set(key, value)
	})
	return {
		statusCode: 307,
		headers: {
			Location: url.toString(),
		},
	}
})
