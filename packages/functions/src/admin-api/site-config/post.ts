import { useFormData } from 'sst/node/api';
import { z } from 'zod';

import { validateSearchParams, ProtectedApiHandler } from '@lib/api';
import { TWITCH_GIFT_SUB_ID } from '@lil-indigestion-cards/core/constants';
import { updateBatchTwitchEvents, updateSiteConfig } from '@lib/site-config';

export const handler = ProtectedApiHandler(async () => {
	const params = useFormData();

	const rarity = new URLSearchParams(params?.get('base-rarity') ?? '');

	const validationResult = validateSearchParams(rarity, {
		rarityId: 'string',
		rarityName: 'string',
		frameUrl: 'string',
		rarityColor: 'string',
	});

	if (!validationResult.success)
		return { statusCode: 400, body: validationResult.errors.join(' ') };
	const rarityObject = validationResult.value;

	type Event = Parameters<typeof updateBatchTwitchEvents>[0][number];

	const events: Event[] = [];
	params?.forEach((value, key) => {
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

	return { statusCode: 200, body: 'Site config saved.' };
});

function parseEventValue(value: string): {
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
