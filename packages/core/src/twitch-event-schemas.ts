import { z } from 'zod'

const user_id = z.string()
const user_name = z.string()
const user_login = z.string().nullable()
const user_input = z.string().nullable()
const broadcaster_user_id = z.string()
const broadcaster_user_name = z.string()
const broadcaster_user_login = z.string()
const total = z.number()
const tier = z.string()
const cumulative_total = z.number()
const is_gift = z.boolean()
const is_anonymous = z.boolean()
const channelPointRedemptionStatus = z.enum([
	'unfulfilled',
	'fulfilled',
	'canceled',
	'unknown',
])

const reward = z.object({
	id: z.string(),
	title: z.string(),
	cost: z.number(),
	prompt: z.string(),
})

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
})

interface ChannelSubscriptionGiftBody extends BaseBody {
	type: 'channel.subscription.gift'
	event: z.infer<typeof channelSubscriptionGiftEvent>
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
})

interface ChannelChannelPointsCustomRewardRedemptionAddBody extends BaseBody {
	type: 'channel.channel_points_custom_reward_redemption.add'
	event: z.infer<typeof channelChannelPointsCustomRewardRedemptionAddEvent>
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
})

interface BaseBody {
	challenge: string | undefined
	subscription: z.infer<typeof subscription>
}
const baseBody = z.object({
	challenge: z.string().optional(),
	subscription,
})

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
					type: z.literal(
						'channel.channel_points_custom_reward_redemption.add'
					),
				}),
				event: channelChannelPointsCustomRewardRedemptionAddEvent,
			}),
		])
	)
	.transform((b) => ({ ...b, type: b.subscription.type } as TwitchBody))

export type TwitchBody =
	| ChannelSubscriptionGiftBody
	| ChannelChannelPointsCustomRewardRedemptionAddBody
