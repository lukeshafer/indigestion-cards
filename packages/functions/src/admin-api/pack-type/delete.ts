import { ProtectedApiHandler, useValidateFormData } from '@lil-indigestion-cards/core/lib/api';
import { deletePackTypeById } from '@lil-indigestion-cards/core/lib/pack-type';

export const handler = ProtectedApiHandler(async () => {
	const validation = useValidateFormData({
		packTypeId: 'string',
	});

	if (!validation.success) return { statusCode: 400, body: validation.errors.join(' ') };

	const result = await deletePackTypeById({ packTypeId: validation.value.packTypeId });
	if (!result.success) return { statusCode: 500, body: 'Failed to delete pack type' };

	return { statusCode: 200, body: 'Pack type deleted!' };
});
