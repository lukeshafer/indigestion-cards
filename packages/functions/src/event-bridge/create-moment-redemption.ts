import { type MomentDetail } from '@core/events/moments';
import { createMomentRedemption } from '@core/lib/moments';
import { setAdminEnvSession } from '@core/lib/session';
import type { EventBridgeEvent } from 'aws-lambda';

export async function handler(event: EventBridgeEvent<'moment-redeemed', MomentDetail>) {
	setAdminEnvSession('Event: create-moment-redemption', 'event_create-moment-redemption');
	console.log('Create moment', event.detail);
	await createMomentRedemption(event.detail);
}
