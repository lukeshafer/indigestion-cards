import { EventBridge } from '@aws-sdk/client-eventbridge';
import {
  subscribeToTwitchEvent,
  getActiveTwitchEventSubscriptions,
  SUBSCRIPTION_TYPE,
  deleteTwitchEventSubscription,
  type SubscriptionType,
  type TwitchEvent,
} from '@core/lib/twitch';
import { Resource } from 'sst';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  const activeSubscriptions = await getActiveTwitchEventSubscriptions();

  console.log(JSON.stringify(activeSubscriptions, null, 2));

  const subDetails: Record<SubscriptionType, TwitchSubscriptionDetails | undefined> = {
    [SUBSCRIPTION_TYPE.GIFT_SUB]: {
      exists: false,
      details: {
        type: SUBSCRIPTION_TYPE.GIFT_SUB,
        callback: `${Resource.TwitchAPI.url}`,
        condition: {
          broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
        },
      },
    },
    [SUBSCRIPTION_TYPE.REDEEM_REWARD]: {
      exists: false,
      details: {
        type: SUBSCRIPTION_TYPE.REDEEM_REWARD,
        callback: `${Resource.TwitchAPI.url}`,
        condition: {
          broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
        },
      },
    },
    [SUBSCRIPTION_TYPE.ADD_REWARD]: {
      exists: false,
      details: {
        type: SUBSCRIPTION_TYPE.ADD_REWARD,
        callback: `${Resource.TwitchAPI.url}`,
        condition: {
          broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
        },
      },
    },
    [SUBSCRIPTION_TYPE.UPDATE_REWARD]: {
      exists: false,
      details: {
        type: SUBSCRIPTION_TYPE.UPDATE_REWARD,
        callback: `${Resource.TwitchAPI.url}`,
        condition: {
          broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
        },
      },
    },
    [SUBSCRIPTION_TYPE.REMOVE_REWARD]: {
      exists: false,
      details: {
        type: SUBSCRIPTION_TYPE.REMOVE_REWARD,
        callback: `${Resource.TwitchAPI.url}`,
        condition: {
          broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
        },
      },
    },
  };

  for (const sub of activeSubscriptions) {
    if (sub.status !== 'enabled' || sub.transport.callback !== Resource.TwitchAPI.url) {
      await deleteTwitchEventSubscription(sub.id);
      continue;
    }
    const details = subDetails[sub.type];
    if (details && sub.transport.callback === Resource.TwitchAPI.url) details.exists = true;
  }

  const promises = Object.entries(subDetails).map(([, details]) => {
    if (!details || details.exists) return Promise.resolve(null);
    return subscribeToTwitchEvent(details.details);
  });

  const results = await Promise.all(promises);

  const eventBridge = new EventBridge();
  await eventBridge.putEvents({
    Entries: [
      {
        Source: 'site',
        DetailType: 'refresh-channel-point-rewards',
        Detail: JSON.stringify({}),
        EventBusName: Resource.EventBus.name,
      },
    ],
  });

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

interface TwitchSubscriptionDetails {
  exists: boolean;
  details: TwitchEvent;
}
