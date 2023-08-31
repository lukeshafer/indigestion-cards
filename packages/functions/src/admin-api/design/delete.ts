import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import { deleteCardDesignById } from '@lil-indigestion-cards/core/card';
import { deleteS3ObjectByUrl } from '@lil-indigestion-cards/core/utils';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({
		designId: 'string',
		imgUrl: 'string',
		cardName: ['string', 'optional'],
	});

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const params = validateResult.value;

	const result = await deleteCardDesignById({ designId: params.designId });
	if (!result.success) return { statusCode: 500, body: result.error };

	try {
		await deleteS3ObjectByUrl(params.imgUrl);
	} catch (error) {
		console.error(error);
		return { statusCode: 500, body: 'An error occurred while deleting the image.' };
	}

	return {
		statusCode: 200,
		body: `Design ${params.cardName ? params.cardName : params.designId} deleted!`,
	};
});
