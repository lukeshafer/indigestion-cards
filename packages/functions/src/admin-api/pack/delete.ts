import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import { deleteFirstPackForUser } from '@lil-indigestion-cards/core/card';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({ username: 'string', userId: 'string' });

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const { username, userId } = validateResult.value;

	console.log(`Deleting 1 pack for ${username}`);
	const result = await deleteFirstPackForUser({ userId, username });
	if (!result.success) return { statusCode: 400, body: result.error };

	return { statusCode: 200, body: `Deleted 1 pack for ${username}` };
});