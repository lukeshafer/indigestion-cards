import { migration } from '@lil-indigestion-cards/core/migrations';
import { setAdminEnvSession } from '@lib/session';

export async function handler() {
	setAdminEnvSession('Migration Deployment Script', 'migration_deployment_script');
	await migration();
}
