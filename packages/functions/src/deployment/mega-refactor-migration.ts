import { setAdminEnvSession } from '@core/lib/session';
import MEGA_SUPER_MIGRATION from '../../../core/src/migrations/mega-refactor-migration'

export const handler = async () => {
	setAdminEnvSession('Migration Deployment Script', 'migration_deployment_script');
  return await MEGA_SUPER_MIGRATION()
}
