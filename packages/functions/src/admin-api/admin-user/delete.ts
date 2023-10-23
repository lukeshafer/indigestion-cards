import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/lib/api';
import { deleteAdminUser } from '@lil-indigestion-cards/core/lib/admin-user';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({
		userId: 'string',
		username: 'string',
		isStreamer: 'boolean',
	});

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const { userId, username, isStreamer } = validateResult.value;

	console.log(`Deleting user ${username} (${userId})`);

	const result = await deleteAdminUser({ userId, username, isStreamer });

	if (!result.success)
		return { statusCode: 500, body: 'An error occurred while deleting the user.' };

	return { statusCode: 200, body: `Successfully deleted user ${username} (ID: ${userId})` };
});
