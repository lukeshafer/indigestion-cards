import { broadcastMessage } from '@core/lib/ws';
import { setAdminEnvSession } from '@core/lib/session';
import { refreshRemainingPackCount } from '@core/lib/pack';

export async function handler() {
	setAdminEnvSession('Event: packs updated', 'event_packs_updated');
	console.log('Packs updated: sending refresh message...');

	await broadcastMessage({ messageData: 'REFRESH_PACKS' }).then(console.log);
	await refreshRemainingPackCount();

	return { statusCode: 200 };
}
