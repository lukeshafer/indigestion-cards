import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { z } from 'zod'
import { createCardDesign } from '@lil-indigestion-cards/core/card'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
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

	const { seriesId, cardName, cardDescription, artist, designId, releaseDate, rarityDetails } =
		body.data

	const result = await createCardDesign({
		seriesId,
		cardName,
		cardDescription,
		artist,
		designId,
		releaseDate,
		rarityDetails,
	})

	return result.success
		? { statusCode: 200, body: JSON.stringify(result.data) }
		: result.error === 'Design already exists'
			? { statusCode: 409, body: result.error }
			: { statusCode: 500, body: result.error }
}
