import { z } from 'zod'
import { createCardDesign, deleteUnmatchedDesignImage } from '@lil-indigestion-cards/core/card'
import { ApiHandler, useFormValue, useHeader, useFormData } from 'sst/node/api'

export const handler = ApiHandler(async (event) => {
	//const seriesId = useFormValue('seriesId')
	//const cardName = useFormValue('cardName')
	//const cardDescription = useFormValue('cardDescription')
	//const artist = useFormValue('artist')
	//const designId = useFormValue('designId')
	//const releaseDate = useFormValue('releaseDate') ?? undefined
	//const imgUrl = useFormValue('imgUrl')
	//const imageKey = useFormValue('imageKey')

	const { body: rawBody } = event
	if (!rawBody) return { statusCode: 400, body: 'Missing body' }

	const unparsedBody = JSON.parse(rawBody)
	const body = z
		.object({
			seriesId: z.string().min(1),
			cardName: z.string().min(1),
			cardDescription: z.string(),
			artist: z.string(),
			designId: z.string().min(1),
			releaseDate: z.string().optional(),
			imgUrl: z.string(),
			imageKey: z.string(),
			rarityDetails: z.array(
				z.object({
					rarityLevel: z.string(),
					count: z.number(),
				})
			),
		})
		.safeParse(unparsedBody)

	if (!body.success) {
		console.error(body.error)
		return { statusCode: 400, body: JSON.stringify(body.error.format()) }
	}

	const result = await createCardDesign(body.data)

	if (result.success) {
		await deleteUnmatchedDesignImage(body.data.imageKey)
	}

	const referer = useHeader('referer') ?? '/'
	console.log(result)

	return result.success
		? { statusCode: 200, headers: { Location: `${referer}/design/${body.data.designId}` } }
		: result.error === 'Design already exists'
			? { statusCode: 409, body: result.error }
			: { statusCode: 500, body: result.error }
})
