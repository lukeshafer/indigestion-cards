import { useValidateFormData, ProtectedApiHandler } from '@lib/api';
import { createAdminUser } from '@lib/admin-user';
import { getUserByLogin } from '@lib/twitch';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({
		username: 'string',
	});

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const { username } = validateResult.value;
	const user = await getUserByLogin(username);

	if (!user) return { statusCode: 404, body: 'Twitch user not found' };

	const { display_name, id } = user;
	const createResult = await createAdminUser({ userId: id, username: display_name });
	if (!createResult.success)
		return { statusCode: 500, body: 'An error occurred while creating the user.' };

	return { statusCode: 200, body: `Successfully created user ${display_name} (ID: ${id})` };
});
