import { ApiHandler, useJsonBody } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';
import { z } from 'zod';
import { addBatchTwitchEventsToDb } from '@lil-indigestion-cards/core/site-config';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};

	const unparsedBody = useJsonBody();

	const parseResult = z
		.object({
			channelPointRewards: z.array(
				z.object({
					twitchEventId: z.string(),
					twitchEventName: z.string(),
					packTypeId: z
						.string()
						.optional()
						.transform((val) => val || ''),
					packTypeName: z
						.string()
						.optional()
						.transform((val) => val || ''),
					cost: z.number().optional(),
				})
			),
		})
		.safeParse(unparsedBody);

	if (!parseResult.success) {
		return {
			statusCode: 400,
			body: JSON.stringify(parseResult.error),
		};
	}

	const body = parseResult.data;

	await addBatchTwitchEventsToDb({
		events: body.channelPointRewards.map((event) => ({
			eventId: event.twitchEventId,
			eventName: event.twitchEventName,
			packTypeId: event.packTypeId,
			packTypeName: event.packTypeName,
			cost: event.cost,
			eventType: 'channel.channel_points_custom_reward_redemption.add',
		})),
	});

	return {
		statusCode: 200,
		body: JSON.stringify({}),
	};
});
