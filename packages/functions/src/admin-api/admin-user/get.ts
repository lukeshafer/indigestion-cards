import { ProtectedApiHandler } from '@lib/api';
import { getAllAdminUsers } from '@lib/admin-user';

export const handler = ProtectedApiHandler(async () => {
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
