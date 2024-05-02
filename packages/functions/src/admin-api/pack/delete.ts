import { SiteHandler } from '@core/lib/api';
import { deleteFirstPackForUser } from '@core/lib/pack';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			username: 'string',
			userId: 'string',
		},
	},
	async (_, { params }) => {
		const { username, userId } = params;

		console.log(`Deleting 1 pack for ${username}`);
		const result = await deleteFirstPackForUser({ userId, username });
		if (!result.success) return { statusCode: 400, body: result.error };

		return { statusCode: 200, body: `Deleted 1 pack for ${username}` };
	}
);
