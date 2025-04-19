import { Resource } from 'sst';
import { ZodValidator, createEventBuilder } from 'sstv2/node/event-bus';
import { z } from 'zod';

const event = createEventBuilder({
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
