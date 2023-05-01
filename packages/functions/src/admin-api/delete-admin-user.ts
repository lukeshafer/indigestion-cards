import { deleteAdminUser } from '@lil-indigestion-cards/core/user';
import { ApiHandler, useFormValue } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};

	const userId = useFormValue('userId');
	if (!userId) return { statusCode: 400, body: 'Missing userId' };
	if (userId === session.properties.userId)
		return { statusCode: 400, body: 'Cannot delete yourself' };

	const result = await deleteAdminUser({ userId: userId });

	return result.success
		? {
				statusCode: 200,
				body: JSON.stringify({
					message: 'User deleted!',
				}),
		  }
		: {
				statusCode: 500,
				body: result.error,
		  };
});
