import { ApiHandler, useFormValue } from 'sst/node/api';
import { getUserByLogin } from '@lil-indigestion-cards/core/twitch-helpers';
import { useSession } from 'sst/node/future/auth';
import { packSchema, givePackToUser } from '@lil-indigestion-cards/core/pack';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin') {
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};
	}

	const username = useFormValue('username');
	const rawCount = useFormValue('count');
	const paramUserId = useFormValue('userId');
	const packTypeString = useFormValue('packType');
	if (!username) return { statusCode: 400, body: 'Missing user id or user name' };
	if (!packTypeString) return { statusCode: 400, body: 'Missing pack type' };
	const userId = paramUserId ?? (await getUserByLogin(username)).id;

	const count = Number(rawCount) || 1;

	try {
		const packTypeUnparsed = JSON.parse(packTypeString);
		const packDetails = packSchema.parse({
			username,
			userId,
			packCount: count,
			packType: packTypeUnparsed,
		});

		await givePackToUser(packDetails);
	} catch (error) {
		if (error instanceof Error) return { statusCode: 500, body: error?.message };
		return { statusCode: 500, body: 'Unknown error' };
	}

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: `Gave ${count} pack${count > 1 ? 's' : ''} to ${username}`,
		}),
	};
});
