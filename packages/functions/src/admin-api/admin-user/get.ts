import { SiteHandler } from '@core/lib/api';
import { getAllAdminUsers } from '@core/lib/admin-user';

export const handler = SiteHandler({ authorizationType: 'admin' }, async () => {
	const users = await getAllAdminUsers();

	return {
		statusCode: 200,
		body: JSON.stringify(
			users.map((user) => ({
				username: user.username,
				userId: user.userId,
				isStreamer: user.isStreamer,
			}))
		),
	};
});
