import { seedAdmins, seedSiteConfig } from '@lil-indigestion-cards/core/db-seeds';
import { setAdminEnvSession } from '@lil-indigestion-cards/core/lib/session';

export async function handler() {
	setAdminEnvSession('Deployment Script', 'deployment_script');
	const result = await Promise.all([seedAdmins(), seedSiteConfig()]);

	return {
		statusCode: result ? 200 : 500,
	};
}
