import { migration } from '@core/migrations';
import { setAdminEnvSession } from '@core/lib/session';

export async function handler() {
	setAdminEnvSession('Migration Deployment Script', 'migration_deployment_script');
	await migration();
}
