import { EventHandler } from 'sst/node/event-bus';
import { Moment } from '@lil-indigestion-cards/core/events/moments';
import { createMomentRedemption } from '@lil-indigestion-cards/core/lib/moments';
import { setAdminEnvSession } from '@lil-indigestion-cards/core/lib/session';

export const handler = EventHandler(Moment.Redeemed, async event => {
	setAdminEnvSession('Event: create-moment-redemption', 'event_create-moment-redemption');
	console.log('Create moment', event.properties);
	await createMomentRedemption(event.properties);
});
