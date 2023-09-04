import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import { updateCardDesign } from '@lil-indigestion-cards/core/card';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({
		designId: 'string',
		cardDescription: 'string',
	});

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const params = validateResult.value;

	const result = await updateCardDesign(params);

	if (!result.success)
		return { statusCode: 500, body: 'An error occurred while updating the card text.' };

	return { statusCode: 200, body: 'Card text updated successfully.' };
});