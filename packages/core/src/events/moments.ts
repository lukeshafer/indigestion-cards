import { Resource } from 'sst';
import { ZodValidator, createEventBuilder } from 'sstv2/node/event-bus';
import { z } from 'zod';

const event = createEventBuilder({
  // @ts-expect-error The types expect a SST v2 event bus but this should still work
	bus: Resource.EventBus.name,
	validator: ZodValidator,
});

export const Moment = {
	Redeemed: event(
		'moment.redeemed',
		z.object({
			userId: z.string(),
			username: z.string(),
		})
	),
};
