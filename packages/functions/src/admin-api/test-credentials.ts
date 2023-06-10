import { ApiHandler } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';

export const handler = ApiHandler(async () => {
	const session = useSession();

	if (session.type !== 'admin')
		return {
			status: 200,
			body: 'Not an admin',
		};

	return {
		status: 200,
		body: 'Hello admin',
	};
});
