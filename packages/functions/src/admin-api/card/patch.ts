import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import { openCardFromPack } from '@lil-indigestion-cards/core/card';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({
		instanceId: 'string',
		designId: 'string',
		packId: 'string',
	});

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const { instanceId, designId, packId } = validateResult.value;

	console.log('Opening card', { instanceId, designId, packId });
	const result = await openCardFromPack({ instanceId, designId, packId });

	if (!result.success) {
		console.error(result);
		return { statusCode: 400, body: result.error || 'There was an error opening the card.' };
	}

	return { statusCode: 200, body: "Card opened." };
});
