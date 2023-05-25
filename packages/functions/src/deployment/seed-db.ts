import { seedAdmins } from '@lil-indigestion-cards/core/db-seeds';
import { setAdminEnvSession } from '@lil-indigestion-cards/core/user';

export async function handler() {
	setAdminEnvSession('Deployment Script', 'deployment_script');
	const result = await seedAdmins();

	return {
		statusCode: result ? 200 : 500,
	};
}
