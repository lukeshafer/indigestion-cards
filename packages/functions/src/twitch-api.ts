import { type APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { EventBus } from 'sst/node/event-bus';
import { EventBridge } from 'aws-sdk';
import {
	verifyDiscordRequest,
	parseRequestBody,
	MESSAGE_TYPE,
	getHeaders,
} from '@lil-indigestion-cards/core/twitch-helpers';
import {
	getTwitchEventById,
	checkIsDuplicateTwitchEventMessage,
} from '@lil-indigestion-cards/core/site-config';
import { getPackTypeById } from '@lil-indigestion-cards/core/card';
import { TWITCH_GIFT_SUB_ID } from '@lil-indigestion-cards/core/constants';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
	if (!verifyDiscordRequest(event) || !event.body) {
		console.error('Message not verified');
		return { statusCode: 403 };
	}

	const { messageType, messageId } = getHeaders(event.headers);
	if (!messageId || (await checkIsDuplicateTwitchEventMessage({ message_id: messageId }))) {
		console.error('Duplicate message');
		return { statusCode: 200 };
	}
	const unsafeBody = JSON.parse(event.body) as unknown;

	if (messageType === MESSAGE_TYPE.VERIFICATION) {
		if (
			!unsafeBody ||
			typeof unsafeBody !== 'object' ||
			!('challenge' in unsafeBody) ||
			typeof unsafeBody.challenge !== 'string'
		) {
			console.error('Invalid verification request');
			return { statusCode: 400 };
		}

		return {
			statusCode: 200,
			body: unsafeBody.challenge,
		};
	}

	if (messageType !== MESSAGE_TYPE.NOTIFICATION) {
		console.error('Invalid message type');
		return { statusCode: 400 };
	}

	const body = parseRequestBody(unsafeBody);

	const eventBridge = new EventBridge();
	switch (body.type) {
		case 'channel.subscription.gift':
			// FIXME: remove this once we're confident in the logic, should always be 5
			const SUBS_PER_PACK = ['luke', 'dev'].includes(process.env.SST_STAGE || '') ? 1 : 5;
			const specialSubRoundLookup: Record<number, number> = {
				69: 70,
			};

			const subsGifted =
				body.event.total && body.event.total in specialSubRoundLookup
					? specialSubRoundLookup[body.event.total]
					: body.event.total || 0;
			if (subsGifted < SUBS_PER_PACK) {
				// gifted less than SUBS_PER_PACK subs, ignore
				return { statusCode: 200 };
			}

			const totalPacks = Math.floor(subsGifted / SUBS_PER_PACK);

			const event = await getTwitchEventById({ eventId: TWITCH_GIFT_SUB_ID });
			if (!event || !event.packTypeId) {
				return { statusCode: 200 };
			}

			const giftSubPackType = await getPackTypeById({ packTypeId: event.packTypeId });

			await eventBridge
				.putEvents({
					Entries: [
						{
							Source: 'twitch',
							DetailType: 'give-pack-to-user',
							Detail: JSON.stringify({
								userId: body.event.user_id,
								username: body.event.user_name,
								packCount: totalPacks,
								packType: giftSubPackType,
							}),
							EventBusName: EventBus.eventBus.eventBusName,
						},
					],
				})
				.promise();
			break;
		case 'channel.channel_points_custom_reward_redemption.add':
			console.log('Redeemed channel points', body);
			const rewardId = body.event.reward.id;
			const reward = await getTwitchEventById({ eventId: rewardId });
			if (!reward || !reward.packTypeId) {
				return { statusCode: 200 };
			}

			const rewardPackType = await getPackTypeById({ packTypeId: reward.packTypeId });

			await eventBridge
				.putEvents({
					Entries: [
						{
							Source: 'twitch',
							DetailType: 'give-pack-to-user',
							Detail: JSON.stringify({
								userId: body.event.user_id,
								username: body.event.user_name,
								packCount: 1,
								packType: rewardPackType,
							}),
							EventBusName: EventBus.eventBus.eventBusName,
						},
					],
				})
				.promise();
			break;
		case 'channel.channel_points_custom_reward.add':
		case 'channel.channel_points_custom_reward.update':
		case 'channel.channel_points_custom_reward.remove':
			console.log('Refresh channel point rewards');
			await eventBridge
				.putEvents({
					Entries: [
						{
							Source: 'twitch',
							DetailType: 'refresh-channel-point-rewards',
							Detail: JSON.stringify({}),
							EventBusName: EventBus.eventBus.eventBusName,
						},
					],
				})
				.promise();
			break;
	}
	return { statusCode: 200 };
};
