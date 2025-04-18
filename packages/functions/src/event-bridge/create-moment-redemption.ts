import { EventHandler } from 'sstv2/node/event-bus';
import { Moment } from '@core/events/moments';
import { createMomentRedemption } from '@core/lib/moments';
import { setAdminEnvSession } from '@core/lib/session';

export const handler = EventHandler(Moment.Redeemed, async event => {
	setAdminEnvSession('Event: create-moment-redemption', 'event_create-moment-redemption');
	console.log('Create moment', event.properties);
	await createMomentRedemption(event.properties);
});
