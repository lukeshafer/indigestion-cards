import { validateSearchParams } from '@core/lib/api';
import { z } from 'zod';
import { TWITCH_GIFT_SUB_ID } from '@core/constants';
import type { SiteConfig } from '@core/types';
import { updateBatchTwitchEvents, updateSiteConfig } from '@core/lib/site-config';
import { updateAllCardRarityRanks } from '@core/lib/card';
import type { APIRoute } from 'astro';

type RarityRanking = NonNullable<SiteConfig['rarityRanking']>;

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();

  const rarityRaw = new URLSearchParams(formData.get('base-rarity') as string ?? '');

  const validationResult = validateSearchParams(rarityRaw, {
    rarityId: 'string',
    rarityName: 'string',
    frameUrl: 'string',
    rarityColor: 'string',
  });

  if (!validationResult.success)
    return new Response(validationResult.errors.join(' '), { status: 400 });

  const rarityObject = validationResult.value;

  type Event = Parameters<typeof updateBatchTwitchEvents>[0][number];

  const events: Event[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith('event-type-')) {
      const eventId = key.replace('event-type-', '');
      const { packTypeId, packTypeName } = parseEventValue(value as string);
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

  const rarityRanking = parseRanking(formData.get('rarityRanking') as string ?? '{}');
  const tradingIsEnabled = typeof formData.get('tradingIsEnabled') === 'string';

  const siteConfig = updateSiteConfig({
    baseRarity: rarityObject,
    messages: [],
    rarityRanking,
    tradingIsEnabled,
  });
  const batchTwitchEvents = updateBatchTwitchEvents(events);
  const updatedCardsPromise = updateAllCardRarityRanks(rarityRanking);

  await Promise.all([siteConfig, batchTwitchEvents, updatedCardsPromise]);

  return new Response('Site config saved.', { status: 200 });
};

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
