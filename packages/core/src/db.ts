import { Table } from 'sst/node/table';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { type Attribute, type EntityConfiguration, Entity, Service } from 'electrodb';
import { randomUUID } from 'crypto';

export const config = {
	table: Table.data.tableName,
	client: new DynamoDBClient(),
} satisfies EntityConfiguration;

export const auditAttributes = (entityName: string) =>
	({
		createdAt: {
			type: 'number',
			default: () => Date.now(),
			// cannot be modified after created
			readOnly: true,
		},
		updatedAt: {
			type: 'number',
			// watch for changes to any attribute
			watch: '*',
			// set current timestamp when updated
			set: (_, i) => {
				// add to audit log
				if (
					!process.env.SESSION_USER_ID ||
					(process.env.SESSION_TYPE !== 'admin' && process.env.SESSION_TYPE !== 'user') ||
					!process.env.SESSION_USERNAME
				) {
					throw new Error('Username and ID are required in process.env');
					return;
				}

				audits.create({
					entity: entityName,
					username: process.env.SESSION_USERNAME,
					userId: process.env.SESSION_USER_ID,
					timestamp: Date.now(),
					item: JSON.stringify(i),
				});

				return Date.now();
			},
			readOnly: true,
		},
	}) satisfies Record<string, Attribute>;

const audits = new Entity(
	{
		model: {
			entity: 'audit',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			entity: {
				type: 'string',
				required: true,
			},
			item: {
				type: 'string',
				required: true,
			},
			userId: {
				type: 'string',
				required: true,
			},
			username: {
				type: 'string',
				required: true,
			},
			timestamp: {
				type: 'number',
				required: true,
			},
		},
		indexes: {
			byEntity: {
				pk: {
					field: 'pk',
					composite: ['entity'],
				},
				sk: {
					field: 'sk',
					composite: ['item', 'userId', 'username', 'timestamp'],
				},
			},
			byUserId: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['userId'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['entity', 'item', 'username', 'timestamp'],
				},
			},
		},
	},
	config
);

export const admins = new Entity(
	{
		model: {
			entity: 'admin',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			userId: {
				type: 'string',
				required: true,
			},
			username: {
				type: 'string',
				required: true,
			},
			isStreamer: {
				type: 'boolean',
				required: true,
				default: false,
			},
			...auditAttributes('admin'),
		},
		indexes: {
			allAdmins: {
				collection: 'siteConfig',
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['userId', 'username', 'isStreamer'],
				},
			},
		},
	},
	config
);

export const cardDesigns = new Entity(
	{
		model: {
			entity: 'cardDesign',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			cardName: {
				type: 'string',
				required: true,
			},
			cardDescription: {
				type: 'string',
				required: true,
			},
			designId: {
				type: 'string',
				required: true,
			},
			artist: {
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
			releaseDate: {
				type: 'string',
			},
			isComplete: {
				type: 'boolean',
			},
			imgUrl: {
				type: 'string',
				required: true,
			},
			bestRarityFound: {
				type: 'map',
				properties: {
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
					count: {
						type: 'number',
						required: true,
					},
					rarityColor: {
						type: 'string',
						required: true,
					},
				},
			},
			rarityDetails: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
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
						count: {
							type: 'number',
							required: true,
						},
						rarityColor: {
							type: 'string',
							required: true,
						},
					},
				},
			},
			...auditAttributes('cardDesign'),
		},
		indexes: {
			byDesignId: {
				collection: 'designAndCards',
				pk: {
					field: 'pk',
					composite: ['designId'],
				},
				sk: {
					field: 'sk',
					composite: [],
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
					composite: ['designId'],
				},
			},
			allDesigns: {
				index: 'gsi2',
				pk: {
					field: 'gsi2pk',
					composite: [],
				},
				sk: {
					field: 'gsi2sk',
					composite: ['designId'],
				},
			},
		},
	},
	config
);

export const cardInstances = new Entity(
	{
		model: {
			entity: 'cardInstance',
			version: '1',
			service: 'indigestion-cards',
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
							type: 'number',
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
			byDesignAndRarity: {
				index: 'gsi4',
				pk: {
					field: 'gsi4pk',
					composite: ['designId'],
				},
				sk: {
					field: 'gsi4sk',
					composite: ['rarityId', 'instanceId'],
				},
			},
		},
	},
	config
);

export const momentRedemptions = new Entity(
	{
		model: {
			entity: 'momentRedemption',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			momentDate: {
				type: 'string',
				default: () => new Date().toISOString().slice(0, 10),
				// cannot be modified after created
				readOnly: true,
			},
			userId: {
				type: 'string',
				required: true,
			},
			username: {
				type: 'string',
				required: true,
			},
			...auditAttributes('momentRedemption'),
		},
		indexes: {
			primary: {
				pk: {
					field: 'pk',
					composite: ['momentDate'],
				},
				sk: {
					field: 'sk',
					composite: ['userId'],
				},
			},
			getAll: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: [],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['momentDate', 'userId'],
				},
			},
		},
	},
	config
);

export const packTypes = new Entity(
	{
		model: {
			entity: 'packType',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			packTypeId: {
				type: 'string',
				required: true,
			},
			packTypeName: {
				type: 'string',
				required: true,
			},
			packTypeDescription: {
				type: 'string',
			},
			packTypeCategory: {
				type: ['season', 'custom'] as const,
				required: true,
			},
			cardCount: {
				type: 'number',
				required: true,
			},
			seasonId: {
				type: 'string',
			},
			seasonName: {
				type: 'string',
			},
			designs: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						designId: {
							type: 'string',
							required: true,
						},
						cardName: {
							type: 'string',
							required: true,
						},
						imgUrl: {
							type: 'string',
							required: true,
						},
					},
				},
			},
			...auditAttributes('packType'),
		},
		indexes: {
			allPackTypes: {
				collection: 'siteConfig',
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['packTypeId'],
				},
			},
			bySeasonId: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['seasonId'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['packTypeId'],
				},
			},
		},
	},
	config
);

export const packs = new Entity(
	{
		model: {
			entity: 'pack',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			packId: {
				type: 'string',
				required: true,
			},
			packTypeId: {
				type: 'string',
				required: true,
			},
			packTypeName: {
				type: 'string',
				required: true,
			},
			seasonId: {
				type: 'string',
			},
			username: {
				type: 'string',
			},
			userId: {
				type: 'string',
			},
			cardDetails: {
				type: 'list',
				required: true,
				items: {
					type: 'map',
					properties: {
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
						opened: {
							type: 'boolean',
							required: true,
							default: false,
						},
						cardNumber: {
							type: 'number',
							required: true,
						},
						totalOfType: {
							type: 'number',
							required: true,
						},
					},
				},
			},
			...auditAttributes('pack'),
		},
		indexes: {
			allPacks: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['packId'],
				},
			},
			byUsername: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['username'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['packId'],
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
					composite: [],
				},
			},
		},
	},
	config
);

export const preorders = new Entity(
	{
		model: {
			entity: 'preorder',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			id: {
				type: 'string',
				required: true,
				default: randomUUID(),
			},
			userId: {
				type: 'string',
				required: true,
			},
			username: {
				type: 'string',
				required: true,
			},
			...auditAttributes('preorder'),
		},
		indexes: {
			primary: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['username', 'id', 'createdAt'],
				},
			},
		},
	},
	config
);

export const rarities = new Entity(
	{
		model: {
			entity: 'rarity',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
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
			defaultCount: {
				type: 'number',
				required: true,
			},
			rarityColor: {
				type: 'string',
				required: true,
			},
			...auditAttributes('rarity'),
		},
		indexes: {
			allRarities: {
				collection: 'siteConfig',
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['rarityId'],
				},
			},
		},
	},
	config
);

export const seasons = new Entity(
	{
		model: {
			entity: 'season',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			seasonName: {
				type: 'string',
				required: true,
			},
			seasonDescription: {
				type: 'string',
			},
			seasonId: {
				type: 'string',
				required: true,
			},
			...auditAttributes('season'),
		},
		indexes: {
			allSeasons: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['seasonId'],
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
					composite: [],
				},
			},
		},
	},
	config
);

export const siteConfig = new Entity(
	{
		model: {
			entity: 'siteConfig',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			baseRarity: {
				type: 'map',
				required: true,
				properties: {
					rarityId: {
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
					rarityName: {
						type: 'string',
						required: true,
					},
				},
			},
			messages: {
				type: 'list',
				required: true,
				items: {
					type: 'map',
					properties: {
						message: {
							type: 'string',
							required: true,
						},
						type: {
							type: ['error', 'success', 'info', 'warning'] as const,
							required: true,
							default: 'info',
						},
					},
				},
			},
			rarityRanking: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						rarityId: {
							type: 'string',
							required: true,
						},
						rarityName: {
							type: 'string',
							required: true,
						},
						ranking: {
							type: 'number',
							required: true,
						},
					},
				},
			},
			tradingIsEnabled: {
				type: 'boolean',
			},
			faq: {
				type: 'string',
			},
			...auditAttributes('siteConfig'),
		},
		indexes: {
			primary: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: [],
				},
			},
		},
	},
	config
);

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
	stamps: {
		type: 'list',
		items: {
			type: 'string',
		},
	},
} as const;

export const trades = new Entity(
	{
		model: {
			entity: 'trade',
			version: '1',
			service: 'indigestion-cards',
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

export const twitchEventMessageHistory = new Entity(
	{
		model: {
			entity: 'twitchEventMessageHistory',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			message_id: {
				type: 'string',
				required: true,
			},
			message_timestamp: {
				type: 'string',
				required: true,
			},
			...auditAttributes('twitchEventMessageHistory'),
		},
		indexes: {
			byMessageId: {
				pk: {
					field: 'pk',
					composite: ['message_id'],
				},
				sk: {
					field: 'sk',
					composite: [],
				},
			},
		},
	},
	config
);

export const twitchEventTypes = [
	'channel.channel_points_custom_reward_redemption.add',
	'channel.subscription.gift',
] as const;
export const twitchEvents = new Entity(
	{
		model: {
			entity: 'twitchEvents',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			eventId: {
				type: 'string',
				required: true,
			},
			eventName: {
				type: 'string',
				required: true,
			},
			eventType: {
				type: twitchEventTypes,
				required: true,
			},
			packTypeId: {
				type: 'string',
			},
			packTypeName: {
				type: 'string',
			},
			cost: {
				type: 'number',
			},
			isEnabled: {
				type: 'boolean',
			},
			isPaused: {
				type: 'boolean',
			},
			...auditAttributes('twitchEvents'),
		},
		indexes: {
			byEventId: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['eventId', 'eventType'],
				},
			},
		},
	},
	config
);

export const unmatchedImages = new Entity(
	{
		model: {
			entity: 'unmatchedImage',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			imageId: {
				type: 'string',
				required: true,
			},
			url: {
				type: 'string',
				required: true,
			},
			type: {
				type: ['cardDesign', 'frame'] as const,
				required: true,
			},
			...auditAttributes('unmatchedImage'),
		},
		indexes: {
			byType: {
				pk: {
					field: 'pk',
					composite: ['type'],
				},
				sk: {
					field: 'sk',
					composite: ['imageId'],
				},
			},
		},
	},
	config
);

export const userLogins = new Entity(
	{
		model: {
			entity: 'userLogin',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			userId: {
				type: 'string',
				required: true,
				label: 'userId',
			},
			username: {
				type: 'string',
				required: true,
			},
			hasProfile: {
				type: 'boolean',
			},
			...auditAttributes('admin'),
		},
		indexes: {
			allLogins: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['userId'],
				},
			},
			byUsername: {
				index: 'gsi3',
				collection: 'cardsByOwnerName',
				pk: {
					field: 'gsi3pk',
					composite: ['username'],
				},
				sk: {
					field: 'gsi3sk',
					composite: [],
				},
			},
		},
	},
	config
);

export const users = new Entity(
	{
		model: {
			entity: 'user',
			version: '1',
			service: 'indigestion-cards',
		},
		attributes: {
			userId: {
				type: 'string',
				required: true,
			},
			ownerId: {
				type: 'string',
				watch: ['userId'],
				get: (_, { userId }) => userId,
			},
			username: {
				type: 'string',
				required: true,
			},
			cardCount: {
				type: 'number',
				required: true,
				default: 0,
			},
			packCount: {
				type: 'number',
				required: true,
				default: 0,
			},
			lookingFor: {
				type: 'string',
			},
			isTrading: {
				type: 'boolean',
			},
			tradeNotifications: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						status: {
							type: ['statusUpdated', 'newMessage'] as const,
						},
						tradeId: {
							type: 'string',
							required: true,
						},
						text: {
							type: 'string',
						},
						createdAt: {
							type: 'number',
							default: () => Date.now(),
							readOnly: true,
						},
					},
				},
			},
			pinnedCard: {
				type: 'map',
				properties: {
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
					stamps: {
						type: 'list',
						items: {
							type: 'string',
						},
					},
				},
			},
			...auditAttributes('user'),
		},
		indexes: {
			byId: {
				pk: {
					field: 'pk',
					composite: ['userId'],
				},
				sk: {
					field: 'sk',
					composite: [],
				},
			},
			byUsername: {
				index: 'gsi3',
				collection: 'cardsByOwnerName',
				pk: {
					field: 'gsi3pk',
					composite: ['username'],
				},
				sk: {
					field: 'gsi3sk',
					composite: [],
				},
			},
		},
	},
	config
);

export const db = new Service(
	{
		admins,
		cardDesigns,
		cardInstances,
		momentRedemptions,
		packs,
		packTypes,
		preorders,
		rarities,
		seasons,
		siteConfig,
		trades,
		twitchEventMessageHistory,
		twitchEvents,
		unmatchedImages,
		userLogins,
		users,
	},
	config
);
