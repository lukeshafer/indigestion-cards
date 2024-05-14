import type { APIRoute } from 'astro';
import { migrateFromBackupTable } from '@core/lib/data-recovery-migration-20240511';

export const GET: APIRoute = async () => {
	const result = await migrateFromBackupTable(import.meta.env.BACKUP_TABLE_NAME);

	return new Response(JSON.stringify(result), {
		headers: { 'content-type': 'application/json' },
	});
};
