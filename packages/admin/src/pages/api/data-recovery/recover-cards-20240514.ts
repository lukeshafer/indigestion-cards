import type { APIRoute } from 'astro';
import { getDataRecoveryInfo } from '@core/lib/data-recovery';

export const GET: APIRoute = async () => {
	try {
		const result = await getDataRecoveryInfo('20230511');

		return new Response(result, {
			headers: { 'content-type': 'application/json' },
		});
	} catch {
		return new Response('Not found');
	}
};
