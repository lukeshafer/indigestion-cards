import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { TWITCH_GIFT_SUB_ID } from '@lil-indigestion-cards/core/constants';
import { updateBatchTwitchEvents, updateSiteConfig } from '@lil-indigestion-cards/core/site-config';

export const post: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const rarity = new URLSearchParams(params.get('base-rarity') || '');
	const rarityId = rarity.get('rarityId');
	if (!rarityId) return new Response('Missing rarityId', { status: 400 });
	const rarityName = rarity.get('rarityName');
	if (!rarityName) return new Response('Missing rarityName', { status: 400 });
	const frameUrl = rarity.get('frameUrl');
	if (!frameUrl) return new Response('Missing frameUrl', { status: 400 });
	const rarityColor = rarity.get('rarityColor');
	if (!rarityColor) return new Response('Missing rarityColor', { status: 400 });

	const rarityObject = {
		rarityId,
		rarityName,
		frameUrl,
		rarityColor,
	};

	type Event = Parameters<typeof updateBatchTwitchEvents>[0][number];

	const events: Event[] = [];
	params.forEach((value, key) => {
		if (key.startsWith('event-type-')) {
			const eventId = key.replace('event-type-', '');
			const { packTypeId, packTypeName } = parseEventValue(value);
			const event = {
				eventId,
				eventType:
					eventId === TWITCH_GIFT_SUB_ID
						? 'channel.subscription.gift'
						: 'channel.channel_points_custom_reward_redemption.add',
				packTypeId,
				packTypeName,
			} satisfies Event;
			events.push(event);
		}
	});

	const siteConfig = updateSiteConfig({ baseRarity: rarityObject, messages: [] });
	const batchTwitchEvents = updateBatchTwitchEvents(events);

	await Promise.all([siteConfig, batchTwitchEvents]);

	return new Response('Site config saved.', { status: 200 });
};

function parseEventValue(value: any): {
	packTypeId: string | undefined;
	packTypeName: string | undefined;
} {
	const eventValueSchema = z.object({
		packTypeId: z.string().optional(),
		packTypeName: z.string().optional(),
	});

	if (!value)
		return {
			packTypeId: undefined,
			packTypeName: undefined,
		};

	try {
		const parsed = eventValueSchema.parse(JSON.parse(value));
		return {
			packTypeId: parsed.packTypeId,
			packTypeName: parsed.packTypeName,
		};
	} catch {
		return {
			packTypeId: undefined,
			packTypeName: undefined,
		};
	}
}
