import { getPackTypeContents } from '@lil-indigestion-cards/core/pack-type';
import { createPackType } from '@lil-indigestion-cards/core/card';
import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({
		packTypeName: 'string',
		packTypeId: 'string',
		description: ['string', 'optional'],
		cardCountPerPack: 'number',
		category: 'string',
		season: ['string', 'optional'],
		cardDesigns: ['string', 'optional'],
	});

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const params = validateResult.value;

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

	const contents = getPackTypeContents(params);
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
});
