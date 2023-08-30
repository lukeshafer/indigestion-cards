import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import { updatePackUser } from '@lil-indigestion-cards/core/pack';
import { getUserByLogin } from '@lil-indigestion-cards/core/twitch-helpers';
import { getUserByUserName } from '@lil-indigestion-cards/core/user';
import { getPackById } from '@lil-indigestion-cards/core/card';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({
		packId: 'string',
		username: 'string',
	});

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const { packId, username } = validateResult.value;

	const pack = await getPackById({ packId });
	if (!pack) return { statusCode: 404, body: 'Pack not found' };

	const userId =
		(await getUserByUserName(username))?.userId ?? (await getUserByLogin(username))?.id;

	if (!userId) return { statusCode: 404, body: 'User not found' };

	if (pack.username !== username) {
		await updatePackUser({ packId, userId, username });
		return { statusCode: 200, body: 'Pack updated' };
	}

	return { statusCode: 200, body: 'Pack already assigned to user' };
});
