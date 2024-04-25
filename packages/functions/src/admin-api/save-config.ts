import { z } from 'zod';
import { useSession } from 'sst/node/future/auth';
import { ApiHandler, useJsonBody } from 'sst/node/api';
import { updateBatchTwitchEvents } from '@core/lib/site-config';
import { TWITCH_GIFT_SUB_ID } from '@core/constants';
import { setAdminEnvSession } from '@core/lib/session';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};
	setAdminEnvSession(session.properties.username, session.properties.userId);

	const unparsedBody = useJsonBody();

	const parseResult = z
		.object({
			channelPointRewards: z.array(
				z.object({
					twitchEventId: z.string(),
					twitchEventName: z.string(),
					packTypeId: z.string().optional(),
					packTypeName: z.string().optional(),
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

	await updateBatchTwitchEvents(
		body.channelPointRewards.map((event) => ({
			eventId: event.twitchEventId,
			eventName: event.twitchEventName,
			packTypeId: event.packTypeId,
			packTypeName: event.packTypeName,
			cost: event.cost,
			eventType:
				event.twitchEventId === TWITCH_GIFT_SUB_ID
					? 'channel.subscription.gift'
					: 'channel.channel_points_custom_reward_redemption.add',
		}))
	);

	return {
		statusCode: 200,
		body: JSON.stringify({}),
	};
});
