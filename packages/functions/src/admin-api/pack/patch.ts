import { SiteHandler } from '@lib/api';
import { updatePackUser } from '@lib/pack';
import { getUserByLogin } from '@lib/twitch';
import { getUserByUserName } from '@lib/user';
import { getPackById } from '@lib/pack';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			packId: 'string',
			username: 'string',
		},
	},
	async (_, { params }) => {
		const { packId, username } = params;

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
	}
);
