import { parsePackTypeContents } from '@lib/entity-schemas';
import { createPackType } from '@lib/pack-type';
import { SiteHandler } from '@lib/api';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			packTypeName: 'string',
			packTypeId: 'string',
			description: 'string?',
			cardCountPerPack: 'number',
			category: 'string',
			season: 'string?',
			cardDesigns: 'string?',
		},
	},
	async (_, { params }) => {
		if (params.category === 'season' && !params.season)
			return { statusCode: 400, body: 'Missing season.' };
		if (params.category === 'custom' && !params.cardDesigns)
			return { statusCode: 400, body: 'Missing cardDesigns.' };
		if (params.category !== 'season' && params.category !== 'custom')
			return { statusCode: 400, body: 'Invalid category: must be "season" or "custom".' };

		console.log({
			message: 'Creating pack type',
			params,
		});

		const contents = parsePackTypeContents(params);
		if (!contents.success) return { statusCode: 400, body: contents.error };

		const season = contents.season;
		const designs = contents.designs;

		const packType = await createPackType({
			packTypeName: params.packTypeName,
			packTypeId: params.packTypeId,
			packTypeDescription: params.description,
			cardCount: params.cardCountPerPack,
			packTypeCategory: params.category,
			seasonId: season?.seasonId,
			seasonName: season?.seasonName,
			designs: designs,
		});

		if (!packType.success) return { statusCode: 500, body: packType.error };

		return { statusCode: 200, body: 'Pack type created!' };
	}
);
