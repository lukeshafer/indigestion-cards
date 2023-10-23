import type { ChannelPointReward } from './twitch';
import {
	twitchEvents,
	type CreateTwitchEvent,
	type UpdateTwitchEvent,
	twitchEventTypes,
} from '../db/twitchEvents';
import { siteConfig, type SiteConfig, type CreateSiteConfig } from '../db/siteConfig';
import { twitchEventMessageHistory } from '../db/twitchEventMessageHistory';
import { Service } from 'electrodb';
import { config } from '../db/_utils';

export async function updateBatchTwitchEvents(
	events: (UpdateTwitchEvent & {
		eventId: string;
		eventType: CreateTwitchEvent['eventType'];
	})[]
) {
	await Promise.all(
		events.map(async (event) => {
			const { eventId, eventType, ...rest } = event;
			return twitchEvents.update({ eventId, eventType }).set(rest).go();
		})
	);
}

export async function getTwitchEvents() {
	return await twitchEvents.query.byEventId({}).go();
}

export async function getTwitchEventById(args: { eventId: string }) {
	const result = await twitchEvents.query.byEventId(args).go();
	return result.data[0];
}

export function checkIsValidTwitchEventType(
	eventType: string
): eventType is (typeof twitchEventTypes)[number] {
	return twitchEventTypes.some((type) => type === eventType);
}

export async function refreshChannelPointRewards(newRewards: ChannelPointReward[]) {
	const existingRewards = await twitchEvents.query
		.byEventId({ eventType: 'channel.channel_points_custom_reward_redemption.add' })
		.go()
		.then((result) => result.data);

	const rewardsToDelete = existingRewards.filter(
		(reward) => !newRewards.some((newReward) => newReward.id === reward.eventId)
	);
	if (rewardsToDelete.length > 0)
		console.log(
			`Deleting rewards: ${JSON.stringify(
				rewardsToDelete.map((r) => r.eventName),
				null,
				2
			)}`
		);

	const rewardsToAdd = newRewards.filter(
		(newReward) => !existingRewards.some((reward) => reward.eventId === newReward.id)
	);
	if (rewardsToAdd.length > 0)
		console.log(
			`Adding rewards: ${JSON.stringify(
				rewardsToAdd.map((r) => r.title),
				null,
				2
			)}`
		);

	const rewardsToUpdate = newRewards.filter((newReward) =>
		existingRewards.some((reward) => reward.eventId === newReward.id)
	);

	const db = new Service({ twitchEvents }, config);

	const result = await db.transaction
		.write(({ twitchEvents }) => [
			...rewardsToDelete.map((reward) =>
				twitchEvents
					.delete({
						eventId: reward.eventId,
						eventType: 'channel.channel_points_custom_reward_redemption.add',
					})
					.commit()
			),
			...rewardsToAdd.map((reward) =>
				twitchEvents
					.create({
						eventId: reward.id,
						eventName: reward.title,
						eventType: 'channel.channel_points_custom_reward_redemption.add',
					})
					.commit()
			),
			...rewardsToUpdate.map((reward) =>
				twitchEvents
					.update({
						eventId: reward.id,
						eventType: 'channel.channel_points_custom_reward_redemption.add',
					})
					.set({
						eventName: reward.title,
					})
					.commit()
			),
		])
		.go();

	return result.data;
}

export async function checkIsDuplicateTwitchEventMessage(args: { message_id: string }) {
	const result = await twitchEventMessageHistory.query
		.byMessageId({ message_id: args.message_id })
		.go()
		.then((result) => result.data)
		.catch(() => []);

	return result.length > 0;
}

export async function updateSiteConfig(config: CreateSiteConfig) {
	await siteConfig.upsert(config).go();
}

export async function getSiteConfig(): Promise<SiteConfig> {
	const result = await siteConfig.query.primary({}).go();
	return result.data[0];
}

export async function addMessageToSiteConfig(args: SiteConfig['messages'][number]) {
	const siteConfig = await getSiteConfig();
	const existingMessages = siteConfig.messages ?? [];
	if (existingMessages.some((message) => message.message === args.message)) return;
	const newMessages = [...existingMessages, args];
	await updateSiteConfig({ ...siteConfig, messages: newMessages });
}

export async function removeMessageFromSiteConfig(args: { message: string }) {
	const siteConfig = await getSiteConfig();
	const existingMessages = siteConfig.messages ?? [];
	const newMessages = existingMessages.filter(({ message }) => message !== args.message);
	await updateSiteConfig({ ...siteConfig, messages: newMessages });
}
