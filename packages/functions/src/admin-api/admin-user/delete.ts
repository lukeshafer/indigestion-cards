import { SiteHandler } from '@lib/api';
import { deleteAdminUser } from '@lib/admin-user';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			userId: 'string',
			username: 'string',
			isStreamer: 'boolean',
		},
	},
	async (_, { params }) => {
		const { userId, username, isStreamer } = params;

		console.log(`Deleting user ${username} (${userId})`);

		const result = await deleteAdminUser({ userId, username, isStreamer });

		if (!result.success)
			return { statusCode: 500, body: 'An error occurred while deleting the user.' };

		return { statusCode: 200, body: `Successfully deleted user ${username} (ID: ${userId})` };
	}
);
