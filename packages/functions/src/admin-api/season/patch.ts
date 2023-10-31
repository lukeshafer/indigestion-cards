import { useValidateFormData, ProtectedApiHandler } from '@lib/api';
import { updateSeason } from '@lib/season';

export const handler = ProtectedApiHandler(async () => {
	const validationResult = useValidateFormData({
		seasonId: 'string',
		seasonName: 'string',
		seasonDescription: ['string', 'optional'],
	});

	if (!validationResult.success)
		return { statusCode: 400, body: validationResult.errors.join(' ') };
	const params = validationResult.value;

	const result = await updateSeason(params);

	if (!result.success)
		return {
			statusCode: result.error === 'Season does not exist' ? 404 : 500,
			body: result.error,
		};

	return { statusCode: 200, body: 'Season updated!' };
});
