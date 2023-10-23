import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/lib/api';
import { deleteSeasonById } from '@lil-indigestion-cards/core/lib/season';

export const handler = ProtectedApiHandler(async () => {
	const validationResult = useValidateFormData({
		seasonId: 'string',
	});

	if (!validationResult.success)
		return { statusCode: 400, body: validationResult.errors.join(' ') };
	const { seasonId } = validationResult.value;

	const result = await deleteSeasonById(seasonId);

	if (!result.success)
		return {
			statusCode: result.error === 'Season does not exist' ? 404 : 500,
			body: result.error,
		};

	return { statusCode: 200, body: 'Season deleted!' };
});
