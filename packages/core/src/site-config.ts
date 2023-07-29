import { db, twitchEventTypes } from './db';
import type { CreateEntityItem, EntityItem, UpdateEntityItem } from 'electrodb';
import { ChannelPointReward } from './twitch-helpers';

type TwitchEvent = typeof db.entities.twitchEvents;
type SiteConfig = typeof db.entities.siteConfig;

export type TwitchEventEntity = EntityItem<TwitchEvent>;
export type SiteConfigEntity = EntityItem<SiteConfig>;

export async function updateBatchTwitchEvents(
	events: (UpdateEntityItem<TwitchEvent> & {
		eventId: string;
		eventType: CreateEntityItem<TwitchEvent>['eventType'];
	})[]
) {
	await Promise.all(
		events.map(async (event) => {
			const { eventId, eventType, ...rest } = event;
			return db.entities.twitchEvents.update({ eventId, eventType }).set(rest).go();
		})
	);
}

export async function getTwitchEvents() {
	return await db.entities.twitchEvents.query.byEventId({}).go();
}

export async function getTwitchEventById(args: { eventId: string }) {
	const result = await db.entities.twitchEvents.query.byEventId(args).go();
	return result.data[0];
}

export function checkIsValidTwitchEventType(
	eventType: string
): eventType is (typeof twitchEventTypes)[number] {
	return twitchEventTypes.some((type) => type === eventType);
}

export async function refreshChannelPointRewards(newRewards: ChannelPointReward[]) {
	const existingRewards = await db.entities.twitchEvents.query
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
	const result = await db.entities.twitchEventMessageHistory.query
		.byMessageId({ message_id: args.message_id })
		.go()
		.then((result) => result.data)
		.catch(() => []);

	return result.length > 0;
}

export async function updateSiteConfig(config: CreateEntityItem<SiteConfig>) {
	await db.entities.siteConfig.upsert(config).go();
}

export async function getSiteConfig(): Promise<EntityItem<SiteConfig>> {
	const result = await db.entities.siteConfig.query.primary({}).go();
	const config = result.data[0];
	return result.data[0];
}

export async function addMessageToSiteConfig(args: EntityItem<SiteConfig>['messages'][number]) {
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
