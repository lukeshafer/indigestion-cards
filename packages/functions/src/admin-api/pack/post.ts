import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/lib/api';
import { packSchema, packSchemaWithoutUser } from '@lil-indigestion-cards/core/lib/entity-schemas';
import { createPackForNoUser, givePackToUser } from '@lil-indigestion-cards/core/lib/pack';
import { getUserByLogin } from '@lil-indigestion-cards/core/lib/twitch';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({
		username: ['string', 'optional'],
		count: ['number', 'optional'],
		userId: ['string', 'optional'],
		packType: 'string',
	});

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const {
		username,
		count: rawCount,
		userId: paramUserId,
		packType: packTypeString,
	} = validateResult.value;
	const userId = username ? paramUserId ?? (await getUserByLogin(username))?.id ?? null : null;
	const packCount = rawCount || 1;

	if (username && !userId) return { statusCode: 400, body: `User ${username} does not exist` };

	console.log('Creating pack for user: ', { username, userId, packCount, packTypeString });

	try {
		const packType = JSON.parse(packTypeString);

		if (!username || !userId) {
			const parseResult = packSchemaWithoutUser.safeParse({ packCount, packType });
			if (!parseResult.success) {
				return { statusCode: 400, body: parseResult.error.message };
			}
			await createPackForNoUser(parseResult.data);
		} else {
			const parseResult = packSchema.safeParse({ userId, username, packCount, packType });
			if (!parseResult.success) {
				return { statusCode: 400, body: parseResult.error.message };
			}
			await givePackToUser(parseResult.data);
		}
		return { statusCode: 200, body: username ? `Pack given to ${username}` : `Pack created` };
	} catch (error) {
		console.error(error);
		if (error instanceof Error) return { statusCode: 400, body: error.message };
		else return { statusCode: 400, body: 'Unknown error' };
	}
});
