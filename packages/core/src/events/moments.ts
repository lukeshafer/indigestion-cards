import { ZodValidator, createEventBuilder } from 'sst/node/event-bus';
import { z } from 'zod';

const event = createEventBuilder({
	bus: 'eventBus',
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
