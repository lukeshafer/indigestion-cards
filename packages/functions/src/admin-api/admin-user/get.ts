import { ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import { getAllAdminUsers } from '@lil-indigestion-cards/core/user';

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
