import type { ChannelPointReward } from './twitch';
import { db, twitchEventTypes } from '../db';
import type {
	CreateSiteConfig,
	CreateTwitchEvent,
	UpdateTwitchEvent,
	SiteConfig,
} from '../db.types';

export async function updateBatchTwitchEvents(
	events: (UpdateTwitchEvent & {
		eventId: string;
		eventType: CreateTwitchEvent['eventType'];
	})[]
) {
	await Promise.all(
		events.map(async event => {
			const { eventId, eventType, ...rest } = event;
			return db.entities.TwitchEvents.patch({ eventId, eventType }).set(rest).go();
		})
	);
}

export async function getTwitchEvents() {
	return await db.entities.TwitchEvents.query.byEventId({}).go();
}

export async function getTwitchEventById(args: { eventId: string }) {
	const result = await db.entities.TwitchEvents.query.byEventId(args).go();
	return result.data[0];
}

export function checkIsValidTwitchEventType(
	eventType: string
): eventType is (typeof twitchEventTypes)[number] {
	return twitchEventTypes.some(type => type === eventType);
}

export async function refreshChannelPointRewards(newRewards: ChannelPointReward[]) {
	const existingRewards = await db.entities.TwitchEvents.query
		.byEventId({ eventType: 'channel.channel_points_custom_reward_redemption.add' })
		.go()
		.then(result => result.data);

	const rewardsToDelete = existingRewards.filter(
		reward => !newRewards.some(newReward => newReward.id === reward.eventId)
	);
	if (rewardsToDelete.length > 0)
		console.log(
			`Deleting rewards: ${JSON.stringify(
				rewardsToDelete.map(r => r.eventName),
				null,
				2
			)}`
		);

	const rewardsToAdd = newRewards.filter(
		newReward => !existingRewards.some(reward => reward.eventId === newReward.id)
	);
	if (rewardsToAdd.length > 0)
		console.log(
			`Adding rewards: ${JSON.stringify(
				rewardsToAdd.map(r => r.title),
				null,
				2
			)}`
		);

	const rewardsToUpdate = newRewards.filter(newReward =>
		existingRewards.some(reward => reward.eventId === newReward.id)
	);

	const result = await db.transaction
		.write(({ TwitchEvents }) => [
			...rewardsToDelete.map(reward =>
				TwitchEvents.delete({
					eventId: reward.eventId,
					eventType: 'channel.channel_points_custom_reward_redemption.add',
				}).commit()
			),
			...rewardsToAdd.map(reward =>
				TwitchEvents.create({
					eventId: reward.id,
					eventName: reward.title,
					eventType: 'channel.channel_points_custom_reward_redemption.add',
					isEnabled: reward.is_enabled,
					isPaused: reward.is_paused,
				}).commit()
			),
			...rewardsToUpdate.map(reward =>
				TwitchEvents.patch({
					eventId: reward.id,
					eventType: 'channel.channel_points_custom_reward_redemption.add',
				})
					.set({
						eventName: reward.title,
						isEnabled: reward.is_enabled,
						isPaused: reward.is_paused,
					})
					.commit()
			),
		])
		.go();

	return result.data;
}

export async function checkIsDuplicateTwitchEventMessage(args: { message_id: string }) {
	const result = await db.entities.TwitchEventMessageHistory.query
		.byMessageId({ message_id: args.message_id })
		.go()
		.then(result => result.data)
		.catch(() => []);

	return result.length > 0;
}

export async function updateSiteConfig(config: CreateSiteConfig) {
	await db.entities.SiteConfig.upsert(config).go();
}

export async function getSiteConfig(): Promise<SiteConfig> {
	const result = await db.entities.SiteConfig.get({}).go();
	return (
		result.data ?? {
			messages: [],
			baseRarity: {
				rarityId: '',
				rarityName: '',
				frameUrl: '',
				rarityColor: '',
			},
		}
	);
}

export async function getRarityRankForRarity(
	rarity: { rarityId: string },
	rarityRanking?: SiteConfig['rarityRanking']
) {
	if (!rarityRanking) {
		let siteConfig = await getSiteConfig();
		rarityRanking = siteConfig.rarityRanking;
	}

	let matchedRanking = rarityRanking?.find(
		({ rarityId }) => rarityId === rarity.rarityId
	);

	if (!matchedRanking) {
		throw Error(`No matched ranking found for rarity ${rarity.rarityId}`);
	}

	return matchedRanking.ranking;
}

export async function addMessageToSiteConfig(args: SiteConfig['messages'][number]) {
	const siteConfig = await getSiteConfig();
	const existingMessages = siteConfig.messages ?? [];
	if (existingMessages.some(message => message.message === args.message)) return;
	const newMessages = [...existingMessages, args];
	await updateSiteConfig({ ...siteConfig, messages: newMessages });
}

export async function removeMessageFromSiteConfig(args: { message: string }) {
	const siteConfig = await getSiteConfig();
	const existingMessages = siteConfig.messages ?? [];
	const newMessages = existingMessages.filter(({ message }) => message !== args.message);
	await updateSiteConfig({ ...siteConfig, messages: newMessages });
}

type RarityRankingType = NonNullable<SiteConfig['rarityRanking']>[number];
export type RarityRankingRecord = Record<string, RarityRankingType | undefined>;
export function getRarityRanking(): Promise<ReturnType<typeof transformRarityRanking>>;
export function getRarityRanking(siteConfig: SiteConfig): ReturnType<typeof transformRarityRanking>;
export function getRarityRanking(siteConfig?: SiteConfig) {
	if (!siteConfig) return getSiteConfig().then(transformRarityRanking);
	return transformRarityRanking(siteConfig);
}

export async function getFaq() {
	const result = await getSiteConfig();
	return result.faq;
}

export async function updateFaq(content: string) {
	const siteConfig = await getSiteConfig();
	await updateSiteConfig({ ...siteConfig, faq: content });
}

function transformRarityRanking(siteConfig: SiteConfig) {
	const rarityRanking = siteConfig.rarityRanking ?? [];
	return Object.fromEntries(rarityRanking.map(r => [r.rarityId, r] as const)) || {};
}
