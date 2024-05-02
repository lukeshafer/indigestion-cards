import { SiteHandler } from '@core/lib/api';
import { createAdminUser } from '@core/lib/admin-user';
import { getUserByLogin } from '@core/lib/twitch';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			username: 'string',
		},
	},
	async (_, { params }) => {
		const { username } = params;
		const user = await getUserByLogin(username);

		if (!user) return { statusCode: 404, body: 'Twitch user not found' };

		const { display_name, id } = user;
		const createResult = await createAdminUser({ userId: id, username: display_name });
		if (!createResult.success)
			return { statusCode: 500, body: 'An error occurred while creating the user.' };

		return { statusCode: 200, body: `Successfully created user ${display_name} (ID: ${id})` };
	}
);
