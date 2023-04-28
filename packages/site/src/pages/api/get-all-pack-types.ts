import { getAllPackTypes } from '@lil-indigestion-cards/core/card'
import type { APIRoute } from 'astro'
import { useUser } from '@/session'

export const get: APIRoute = async (ctx) => {
	const session = useUser(ctx.cookies)
	if (session?.type !== 'user') return ctx.redirect('/')
	const packTypes = await getAllPackTypes()

	return {
		statusCode: 200,
		body: JSON.stringify(
			packTypes.map(({ packTypeName, packTypeId }) => ({ packTypeName, packTypeId }))
		),
	}
}
