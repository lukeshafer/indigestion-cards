import { type CreateEntityItem, Entity, type EntityItem, type UpdateEntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';
import { randomUUID } from 'crypto';

export type Trade = EntityItem<typeof trades>;
export type CreateTrade = CreateEntityItem<typeof trades>;
export type UpdateTrade = UpdateEntityItem<typeof trades>;
export type TradeCard = Trade['offeredCards'][number];
const tradeCardsProperties = {
  instanceId: {
    type: 'string',
    required: true,
  },
  designId: {
    type: 'string',
    required: true,
  },
  cardName: {
    type: 'string',
    required: true,
  },
  cardDescription: {
    type: 'string',
    required: true,
  },
  imgUrl: {
    type: 'string',
    required: true,
  },
  rarityId: {
    type: 'string',
    required: true,
  },
  rarityName: {
    type: 'string',
    required: true,
  },
  rarityColor: {
    type: 'string',
    required: true,
  },
  frameUrl: {
    type: 'string',
    required: true,
  },
  cardNumber: {
    type: 'number',
    required: true,
  },
  totalOfType: {
    type: 'number',
    required: true,
  },
} as const;

export const trades = new Entity(
  {
    model: {
      entity: 'trade',
      version: '1',
      service: 'card-app',
    },
    attributes: {
      tradeId: {
        type: 'string',
        default: () => randomUUID(),
        required: true,
      },
      senderUserId: {
        type: 'string',
        required: true,
      },
      senderUsername: {
        type: 'string',
        required: true,
      },
      receiverUserId: {
        type: 'string',
        required: true,
      },
      receiverUsername: {
        type: 'string',
        required: true,
      },
      offeredCards: {
        type: 'list',
        required: true,
        items: {
          type: 'map',
          properties: tradeCardsProperties,
        },
      },
      requestedCards: {
        type: 'list',
        required: true,
        items: {
          type: 'map',
          properties: tradeCardsProperties,
        },
      },
      notificationsForSender: {
        type: 'list',
        items: {
          type: 'string',
        },
      },
      notificationsForReceiver: {
        type: 'list',
        items: {
          type: 'string',
        },
      },
      messages: {
        type: 'list',
        required: true,
        items: {
          type: 'map',
          properties: {
            userId: {
              type: 'string',
              required: true,
            },
            type: {
              type: ['offer', 'response', 'status-update', 'message'] as const,
              required: true,
            },
            message: {
              type: 'string',
              required: true,
            },
          },
        },
      },
      status: {
        type: [
          'pending',
          'accepted',
          'rejected',
          'canceled',
          'completed',
          'failed',
        ] as const,
        required: true,
        default: 'pending',
      },
      statusMessage: {
        type: 'string',
      },
      completedAt: {
        type: 'number',
        watch: ['status'] as const,
        set: (val, { status }) => {
          if (val) return val;
          switch (status) {
            case 'canceled':
            case 'completed':
            case 'failed':
            case 'rejected':
              return Date.now();
          }
        },
      },
      ...auditAttributes('trade'),
    },
    indexes: {
      primary: {
        pk: {
          field: 'pk',
          composite: ['tradeId'],
        },
        sk: {
          field: 'sk',
          composite: [],
        },
      },
      bySenderId: {
        index: 'gsi1',
        pk: {
          field: 'gsi1pk',
          composite: ['senderUserId'],
        },
        sk: {
          field: 'gsi1sk',
          composite: ['tradeId'],
        },
      },
      byReceiverId: {
        index: 'gsi2',
        pk: {
          field: 'gsi2pk',
          composite: ['receiverUserId'],
        },
        sk: {
          field: 'gsi2sk',
          composite: ['tradeId'],
        },
      },
    },
  },
  config
);
