import { migration as secretsToSSM } from './secrets-to-ssm';
import { migration as cardInstance1to2 } from './card-instance-1-to-2';
import { migrateFromBackupTable } from './data-recovery-migration-20240511'

export async function migration() {
  // TODO: remove these migrations
	// await secretsToSSM();
 //  await cardInstance1to2();
 //  await migrateFromBackupTable()
}
