import { Entity } from 'electrodb';
import { config, auditAttributes } from '../db/_utils';
import { cardInstances } from '../db/cardInstances';

export async function migration() {
	const old = await oldInstances.scan.go({ pages: 'all' });
	let successCount = 0;
	let errorCount = 0;
	for (const instance of old.data) {
		try {
			console.log('Migrating instance', instance.instanceId, { instance });
			await cardInstances.create(instance).go();
			await oldInstances.delete(instance).go();
			successCount++;
		} catch (error) {
			console.error('An error occurred with the card', instance.instanceId, {
				instance,
				error,
			});
			errorCount++;
			continue;
		}
	}

	console.log({ successCount, errorCount });
}
export const oldInstances = new Entity(
  {
    model: {
      entity: 'cardInstance',
      version: '1',
      service: 'card-app',
    },
    attributes: {
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
      seasonId: {
        type: 'string',
        required: true,
      },
      seasonName: {
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
      frameUrl: {
        type: 'string',
        required: true,
      },
      rarityColor: {
        type: 'string',
        required: true,
      },
      userId: {
        type: 'string',
      },
      username: {
        type: 'string',
      },
      minterId: {
        type: 'string',
      },
      minterUsername: {
        type: 'string',
      },
      packId: {
        type: 'string',
      },
      openedAt: {
        type: 'string',
      },
      cardNumber: {
        type: 'number',
        required: true,
      },
      totalOfType: {
        type: 'number',
        required: true,
      },
      stamps: {
        type: 'list',
        items: {
          type: 'string',
        },
      },
      tradeHistory: {
        type: 'list',
        items: {
          type: 'map',
          properties: {
            tradeId: {
              type: 'string',
              required: true,
            },
            fromUserId: {
              type: 'string',
              required: true,
            },
            fromUsername: {
              type: 'string',
              required: true,
            },
            toUserId: {
              type: 'string',
              required: true,
            },
            toUsername: {
              type: 'string',
              required: true,
            },
            completedAt: {
              type: 'number',
              required: true,
            },
            version: {
              type: 'number'
            },
            status: {
              type: ['rejected', 'canceled', 'completed', 'failed'] as const,
              required: true,
            },
          },
        },
      },
      ...auditAttributes('cardInstance'),
    },
    indexes: {
      byId: {
        collection: 'designAndCards',
        pk: {
          field: 'pk',
          composite: ['designId'],
        },
        sk: {
          field: 'sk',
          composite: ['instanceId'],
        },
      },
      byOwnerId: {
        collection: 'cardsByOwnerName',
        index: 'gsi3',
        pk: {
          field: 'gsi3pk',
          composite: ['username'],
        },
        sk: {
          field: 'gsi3sk',
          composite: ['instanceId'],
        },
      },
      byPackId: {
        index: 'gsi2',
        collection: 'packsAndCards',
        pk: {
          field: 'gsi2pk',
          composite: ['packId'],
        },
        sk: {
          field: 'gsi2sk',
          composite: ['instanceId'],
        },
      },
      bySeasonId: {
        collection: 'seasonAndDesigns',
        index: 'gsi1',
        pk: {
          field: 'gsi1pk',
          composite: ['seasonId'],
        },
        sk: {
          field: 'gsi1sk',
          composite: ['designId', 'instanceId'],
        },
      },
    },
  },
  config
);

