import { createPackType } from '@lil-indigestion-cards/core/card'
import { ApiHandler, useFormValue } from 'sst/node/api'
import { useSession } from 'sst/node/future/auth'

type CardDesignElement = {
	designId: string
	cardName: string
	imgUrl: string
}

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'user')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const validCategories = ['season', 'custom'] as const

	const packTypeName = useFormValue('packTypeName')
	const packTypeId = useFormValue('packTypeId')
	const description = useFormValue('description') ?? undefined
	const cardCountPerPack = useFormValue('cardCountPerPack')
	const category = useFormValue('category') as (typeof validCategories)[number]
	const season = useFormValue('season')
	const cardDesigns = useFormValue('cardDesigns')

	let errorMessage = ''
	if (!packTypeName) errorMessage += 'Missing packTypeName. '
	if (!packTypeId) errorMessage += 'Missing packTypeId. '
	if (!cardCountPerPack || !Number(cardCountPerPack)) errorMessage += 'Missing cardCountPerPack. '
	if (!category) errorMessage += 'Missing category. '
	if (category === 'season' && !season) errorMessage += 'Missing season. '
	if (category === 'custom' && !cardDesigns) errorMessage += 'Missing cardDesigns. '
	if (!validCategories.includes(category)) errorMessage += 'Invalid category. '
	if (errorMessage) return { statusCode: 400, body: 'Error: ' + errorMessage }

	let contents
	try {
		contents = category === 'custom' ? parseCardDesigns(cardDesigns!) : parseSeason(season!)
	} catch (e) {
		return { statusCode: 400, body: 'Error: invalid contents provided' }
	}

	const result = await createPackType({
		...contents,
		packTypeName: packTypeName!,
		packTypeId: packTypeId!,
		packTypeCategory: 'season',
		packTypeDescription: description,
		cardCount: Number(cardCountPerPack!),
	})

	if (!result.success) {
		return {
			statusCode: 400,
			body: 'Error: ' + result.error,
		}
	}

	return {
		statusCode: 200,
		body: `Successfully created pack type ${packTypeName}`,
	}
})

function parseCardDesigns(unparsedDesigns: string) {
	const designs = JSON.parse(unparsedDesigns!) as unknown[]
	if (!Array.isArray(designs)) throw 'cardDesigns must be an array'
	if (
		!designs.every(
			(el): el is CardDesignElement =>
				!!el &&
				typeof el === 'object' &&
				'designId' in el &&
				'cardName' in el &&
				'imgUrl' in el &&
				typeof el.designId === 'string' &&
				typeof el.cardName === 'string' &&
				typeof el.imgUrl === 'string'
		)
	) {
		console.error('cardDesigns does not meet requirements:', unparsedDesigns)
		throw 'cardDesigns format is invalid'
	}
	return { designs }
}

function parseSeason(unparsedSeason: string) {
	const season = JSON.parse(unparsedSeason!) as unknown
	if (!season || typeof season !== 'object') throw 'season must be an object'
	if (!('seasonId' in season) || typeof season.seasonId !== 'string')
		throw 'season must have a seasonId'
	if (!('seasonName' in season) || typeof season.seasonName !== 'string')
		throw 'season must have a seasonName'

	return {
		seasonId: season.seasonId,
		seasonName: season.seasonName,
	}
}
