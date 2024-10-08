import { useFormData } from 'sst/node/api';
import { z } from 'zod';

import { validateSearchParams, SiteHandler } from '@core/lib/api';
import { TWITCH_GIFT_SUB_ID } from '@core/constants';
import type { SiteConfig } from '@core/types';
import { updateBatchTwitchEvents, updateSiteConfig } from '@core/lib/site-config';
import { updateAllCardRarityRanks } from '@core/lib/card';

type RarityRanking = NonNullable<SiteConfig['rarityRanking']>;

export const handler = SiteHandler({ authorizationType: 'admin' }, async () => {
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

  const rarityRanking = parseRanking(params?.get('rarityRanking') ?? '{}');
  console.log({ rarityRanking });

  const tradingIsEnabled = typeof params?.get('tradingIsEnabled') === 'string';

  const siteConfig = updateSiteConfig({
    baseRarity: rarityObject,
    messages: [],
    rarityRanking,
    tradingIsEnabled,
  });
  const batchTwitchEvents = updateBatchTwitchEvents(events);
  const updatedCardsPromise = updateAllCardRarityRanks(rarityRanking)

  await Promise.all([siteConfig, batchTwitchEvents, updatedCardsPromise]);

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

function parseRanking(value: string) {
  const rankingSchema = z.array(
    z.object({
      rarityId: z.string(),
      rarityName: z.string(),
    })
  );

  try {
    const parsed = rankingSchema.parse(JSON.parse(value));
    return parsed.map((rarity, index) => ({
      rarityId: rarity.rarityId,
      rarityName: rarity.rarityName,
      ranking: index + 1,
    })) satisfies RarityRanking;
  } catch {
    return [];
  }
}
