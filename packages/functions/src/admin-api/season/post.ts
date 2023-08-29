import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import { createSeason } from '@lil-indigestion-cards/core/card';

export const handler = ProtectedApiHandler(async () => {
	const result = useValidateFormData({
		seasonId: 'string',
		seasonName: 'string',
		seasonDescription: ['string', 'optional'],
	});

	if (!result.success) return { statusCode: 400, body: result.errors.join(' ') };
	const params = result.value;

	if (!params.seasonId!.match(/^[a-z0-9-]+$/))
		return {
			statusCode: 400,
			body: 'Invalid seasonId. (Must be lowercase, numbers, and dashes only)',
		};

	const season = await createSeason(params);

	if (!season.success)
		return {
			statusCode: season.error === 'Season already exists' ? 409 : 500,
			body: season.error,
		};

	return { statusCode: 200, body: 'Season created!' };
});
