import { EventHandler } from 'sst/node/event-bus';
import { Moment } from '@lil-indigestion-cards/core/events/moments';
import { createMomentRedemption } from '@lil-indigestion-cards/core/lib/moments';

export const handler = EventHandler(Moment.Redeemed, async event => {
	console.log('Create moment', event.properties);
	await createMomentRedemption(event.properties);
});
