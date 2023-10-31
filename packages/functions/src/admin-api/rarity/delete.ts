import { useValidateFormData, ProtectedApiHandler } from '@lib/api';
import { deleteRarityById } from '@lib/rarity';
import { deleteS3ObjectByUrl } from '@lib/images';

export const handler = ProtectedApiHandler(async () => {
	const validationResult = useValidateFormData({
		rarityId: 'string',
		frameUrl: 'string',
		rarityName: ['string', 'optional'],
	});

	if (!validationResult.success)
		return { statusCode: 400, body: validationResult.errors.join(' ') };
	const params = validationResult.value;

	const deleteRarityResult = await deleteRarityById(params.rarityId);

	if (!deleteRarityResult.success) return { statusCode: 500, body: deleteRarityResult.error };

	await deleteS3ObjectByUrl(params.frameUrl);

	return { statusCode: 200, body: 'Rarity deleted!' };
});
