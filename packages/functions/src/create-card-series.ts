import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { z } from 'zod'
import { createSeries } from '@lil-indigestion-cards/core/card'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
	const { body: rawBody } = event
	if (!rawBody) return { statusCode: 400, body: 'Missing body' }

	const unparsedBody = JSON.parse(rawBody)
	const body = z
		.object({
			name: z.string(),
			description: z.string(),
			seriesId: z.string(),
		})
		.safeParse(unparsedBody)

	if (!body.success)
		return { statusCode: 400, body: JSON.stringify(body.error) }

	const { name, description, seriesId } = body.data

	const result = await createSeries({
		seriesId,
		seriesName: name,
		seriesDescription: description,
	})

	return result.success
		? { statusCode: 200, body: JSON.stringify(result.data) }
		: result.error === 'Series already exists'
			? { statusCode: 409, body: result.error }
			: { statusCode: 500, body: result.error }
}
