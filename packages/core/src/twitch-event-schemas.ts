import { z } from 'zod';

const user_id = z.string();
const user_name = z.string();
const user_login = z.string().nullable();
const user_input = z.string().nullable();
const broadcaster_user_id = z.string();
const broadcaster_user_name = z.string();
const broadcaster_user_login = z.string();
const total = z.number().nullable();
const tier = z.string();
const cumulative_total = z.number().nullable();
const is_anonymous = z.boolean();
const channelPointRedemptionStatus = z.enum(['unfulfilled', 'fulfilled', 'canceled', 'unknown']);

export const customReward = z.object({
	id: z.string(),
	background_color: z.string(),
	is_enabled: z.boolean(),
	is_paused: z.boolean(),
	is_in_stock: z.boolean(),
	title: z.string(),
	cost: z.number(),
	prompt: z.string(),
});

export const customRewardResponse = z.object({
	data: z.array(customReward),
});

const reward = z.object({
	id: z.string(),
	title: z.string(),
	cost: z.number(),
	prompt: z.string(),
});

const subscription = z.object({
	id: z.string(),
	version: z.string(),
	status: z.string(),
	cost: z.number(),
	condition: z
		.object({
			broadcaster_user_id: z.string(),
		})
		.optional(),
	transport: z
		.object({
			method: z.string(),
			callback: z.string(),
		})
		.optional(),
	created_at: z.string(),
});

interface ChannelSubscriptionGiftBody extends BaseBody {
	type: 'channel.subscription.gift';
	event: z.infer<typeof channelSubscriptionGiftEvent>;
}
const channelSubscriptionGiftEvent = z.object({
	user_id,
	user_login,
	user_name,
	broadcaster_user_id,
	broadcaster_user_login,
	broadcaster_user_name,
	total,
	tier,
	cumulative_total,
	is_anonymous,
});

interface ChannelChannelPointsCustomRewardRedemptionAddBody extends BaseBody {
	type: 'channel.channel_points_custom_reward_redemption.add';
	event: z.infer<typeof channelChannelPointsCustomRewardRedemptionAddEvent>;
}
const channelChannelPointsCustomRewardRedemptionAddEvent = z.object({
	id: z.string(),
	broadcaster_user_id,
	broadcaster_user_login,
	broadcaster_user_name,
	user_id,
	user_login,
	user_name,
	user_input,
	status: channelPointRedemptionStatus,
	reward,
});

interface ChannelPointsCustomRewardAddBody extends BaseBody {
	type: 'channel.channel_points_custom_reward.add';
	event: z.infer<typeof channelPointsCustomRewardAddEvent>;
}
const channelPointsCustomRewardAddEvent = z.object({
	id: z.string(),
	broadcaster_user_id,
	broadcaster_user_login,
	broadcaster_user_name,
	is_enabled: z.boolean(),
	is_paused: z.boolean(),
	is_in_stock: z.boolean(),
	title: z.string(),
});

interface ChannelPointsCustomRewardUpdateBody extends BaseBody {
	type: 'channel.channel_points_custom_reward.update';
	event: z.infer<typeof channelPointsCustomRewardUpdateEvent>;
}
const channelPointsCustomRewardUpdateEvent = channelPointsCustomRewardAddEvent;

interface ChannelPointsCustomRewardRemoveBody extends BaseBody {
	type: 'channel.channel_points_custom_reward.remove';
	event: z.infer<typeof channelPointsCustomRewardRemoveEvent>;
}
const channelPointsCustomRewardRemoveEvent = channelPointsCustomRewardAddEvent;

interface BaseBody {
	challenge: string | undefined;
	subscription: z.infer<typeof subscription>;
}
const baseBody = z.object({
	challenge: z.string().optional(),
	subscription,
});

export const bodySchema = baseBody
	.and(
		z.union([
			z.object({
				subscription: z.object({
					type: z.literal('channel.subscription.gift'),
				}),
				event: channelSubscriptionGiftEvent,
			}),
			z.object({
				subscription: z.object({
					type: z.literal('channel.channel_points_custom_reward_redemption.add'),
				}),
				event: channelChannelPointsCustomRewardRedemptionAddEvent,
			}),
			z.object({
				subscription: z.object({
					type: z.literal('channel.channel_points_custom_reward.add'),
				}),
				event: channelPointsCustomRewardAddEvent,
			}),
			z.object({
				subscription: z.object({
					type: z.literal('channel.channel_points_custom_reward.update'),
				}),
				event: channelPointsCustomRewardUpdateEvent,
			}),
			z.object({
				subscription: z.object({
					type: z.literal('channel.channel_points_custom_reward.remove'),
				}),
				event: channelPointsCustomRewardRemoveEvent,
			}),
		])
	)
	.transform((b) => ({ ...b, type: b.subscription.type } as TwitchBody));

export type TwitchBody =
	| ChannelSubscriptionGiftBody
	| ChannelChannelPointsCustomRewardRedemptionAddBody
	| ChannelPointsCustomRewardAddBody
	| ChannelPointsCustomRewardUpdateBody
	| ChannelPointsCustomRewardRemoveBody;
