import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { EventBus } from 'sst/node/event-bus';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { verifyTwitchRequest, parseRequestBody, MESSAGE_TYPE, getHeaders } from '@core/lib/twitch';
import { getTwitchEventById, checkIsDuplicateTwitchEventMessage } from '@core/lib/site-config';
import { getPackTypeById } from '@core/lib/pack-type';
import { MOMENT_REDEMPTION_PACK_TYPE_ID, TWITCH_GIFT_SUB_ID } from '@core/constants';
import { setAdminEnvSession } from '@core/lib/session';
import { Moment } from '@core/events/moments';
import type { PackDetails } from '@core/lib/entity-schemas';

export const handler: APIGatewayProxyHandlerV2 = async event => {
	if (!verifyTwitchRequest(event)) {
		console.error('Message not verified');
		return { statusCode: 403 };
	}
	if (!event.body) {
		console.error('No event body.');
		return { statusCode: 400 };
	}
	console.log('Message received from Twitch. Determining type...');

	const { messageType, messageId } = getHeaders(event.headers);
	if (!messageId || (await checkIsDuplicateTwitchEventMessage({ message_id: messageId }))) {
		console.error('Duplicate message');
		return { statusCode: 200 };
	}
	const unsafeBody = JSON.parse(event.body) as unknown;

	setAdminEnvSession('Event: twitch-webhook', 'event_twitch_webhook');

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
		case 'channel.subscription.gift': {
			console.log(`Sub gifted by ${body.event.user_name}. Subs gifted: ${body.event.total}`);

			const SUBS_PER_PACK = 5;
			const specialSubRoundLookup: Record<number, number> = {
				69: 70,
			};

			const subsGifted =
				body.event.total && body.event.total in specialSubRoundLookup
					? specialSubRoundLookup[body.event.total]
					: body.event.total || 0;
			if (subsGifted < SUBS_PER_PACK) {
				// gifted less than SUBS_PER_PACK subs, ignore
				console.log('Gifted less than ${SUBS_PER_PACK} subs, ignoring');
				return { statusCode: 200 };
			}

			const totalPacks = Math.floor(subsGifted / SUBS_PER_PACK);
			console.log(`Giving user ${totalPacks} packs`);

			const event = await getTwitchEventById({ eventId: TWITCH_GIFT_SUB_ID });
			if (!event || !event.packTypeId) {
				return { statusCode: 200 };
			}

			const giftSubPackType = await getPackTypeById({ packTypeId: event.packTypeId });

			let promises = [];
			for (let i = 0; i < totalPacks; i++) {
				promises.push(
					eventBridge.putEvents({
						Entries: [
							{
								Source: 'twitch',
								DetailType: 'give-pack-to-user',
								Detail: JSON.stringify({
									userId: body.event.user_id,
									username: body.event.user_name,
									packCount: 1,
									packType: giftSubPackType,
									event: {
										eventType: body.type,
									},
								} satisfies PackDetails),
								EventBusName: EventBus.eventBus.eventBusName,
							},
						],
					})
				);
			}

      await Promise.all(promises);
			break;
		}
		case 'channel.channel_points_custom_reward_redemption.add': {
			console.log(
				`Channel point reward redeemed by ${
					body.event.user_name
				}. Reward info: ${JSON.stringify(
					{
						rewardId: body.event.reward.id,
						rewardTitle: body.event.reward.title,
					},
					null,
					2
				)}`
			);

			const rewardId = body.event.reward.id;
			const reward = await getTwitchEventById({ eventId: rewardId });
			if (!reward || !reward.packTypeId) {
				if (!reward) console.log(`No reward found for reward id ${rewardId}`);
				else console.log(`No pack type found for reward id ${rewardId}`);
				return { statusCode: 200 };
			}

			if (reward.packTypeId === MOMENT_REDEMPTION_PACK_TYPE_ID) {
				console.log(`Moment redeemed by ${body.event.user_name}`);
				await Moment.Redeemed.publish({
					userId: body.event.user_id,
					username: body.event.user_name,
				});
				break;
			}

			console.log(`Giving user 1 pack`);
			const rewardPackType = await getPackTypeById({ packTypeId: reward.packTypeId });

			await eventBridge.putEvents({
				Entries: [
					{
						Source: 'twitch',
						DetailType: 'give-pack-to-user',
						Detail: JSON.stringify({
							userId: body.event.user_id,
							username: body.event.user_name,
							packCount: 1,
							packType: rewardPackType,
							event: {
								eventType: body.type,
							},
						} satisfies PackDetails),
						EventBusName: EventBus.eventBus.eventBusName,
					},
				],
			});
			break;
		}
		case 'channel.channel_points_custom_reward.add':
		case 'channel.channel_points_custom_reward.update':
		case 'channel.channel_points_custom_reward.remove': {
			console.log(`Channel point reward updated. Event type: ${body.type}`);
			await eventBridge.putEvents({
				Entries: [
					{
						Source: 'twitch',
						DetailType: 'refresh-channel-point-rewards',
						Detail: JSON.stringify({}),
						EventBusName: EventBus.eventBus.eventBusName,
					},
				],
			});
			break;
		}
	}
	return { statusCode: 200 };
};
