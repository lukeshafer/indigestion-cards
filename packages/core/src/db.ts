import { Table } from 'sst/node/table';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { type Attribute, type EntityConfiguration, Entity, Service } from 'electrodb';
import { randomUUID } from 'crypto';

export const dbConfig = {
	table: Table.data.tableName,
	client: new DynamoDBClient(),
} satisfies EntityConfiguration;

export const DB_SERVICE = 'indigestion-cards';

function allItemsPKTemplate(entityName: string, service = DB_SERVICE) {
	return `$${service}#getall_${entityName}`;
}

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
		model: { entity: 'audit', version: '1', service: DB_SERVICE },
		attributes: {
			entity: { type: 'string', required: true },
			item: { type: 'string', required: true },
			userId: { type: 'string', required: true },
			username: { type: 'string', required: true },
			timestamp: { type: 'number', required: true },
		},
		indexes: {
			byEntity: {
				pk: { field: 'pk', composite: ['entity'] },
				sk: { field: 'sk', composite: ['item', 'userId', 'username', 'timestamp'] },
			},
			byUserId: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: ['userId'] },
				sk: { field: 'gsi1sk', composite: ['entity', 'item', 'username', 'timestamp'] },
			},
		},
	},
	dbConfig
);

const Admins = new Entity(
	{
		model: { entity: 'admin', version: '1', service: DB_SERVICE },
		attributes: {
			userId: { type: 'string', required: true },
			username: { type: 'string', required: true },
			isStreamer: { type: 'boolean', required: true, default: false },
			...auditAttributes('admin'),
		},
		indexes: {
			primary: {
				pk: { field: 'pk', composite: ['userId'] },
				sk: { field: 'sk', composite: [] },
			},
			allAdmins: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', template: allItemsPKTemplate('admin'), composite: [] },
				sk: { field: 'gsi1sk', composite: ['userId', 'username', 'isStreamer'] },
			},
		},
	},
	dbConfig
);

const CardDesigns = new Entity(
	{
		model: { entity: 'cardDesign', version: '1', service: DB_SERVICE },
		attributes: {
			cardName: { type: 'string', required: true },
			cardDescription: { type: 'string', required: true },
			designId: { type: 'string', required: true },
			artist: { type: 'string', required: true },
			seasonId: { type: 'string', required: true },
			seasonName: { type: 'string', required: true },
			releaseDate: { type: 'string' },
			isComplete: { type: 'boolean' },
			imgUrl: { type: 'string', required: true },
			bestRarityFound: {
				type: 'map',
				properties: {
					rarityId: { type: 'string', required: true },
					rarityName: { type: 'string', required: true },
					frameUrl: { type: 'string', required: true },
					count: { type: 'number', required: true },
					rarityColor: { type: 'string', required: true },
				},
			},
			rarityDetails: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						rarityId: { type: 'string', required: true },
						rarityName: { type: 'string', required: true },
						frameUrl: { type: 'string', required: true },
						count: { type: 'number', required: true },
						rarityColor: { type: 'string', required: true },
					},
				},
			},
			...auditAttributes('cardDesign'),
		},
		indexes: {
			primary: {
				type: 'clustered',
				collection: 'DesignAndCards',
				pk: { field: 'pk', composite: ['designId'] },
				sk: { field: 'sk', composite: [] },
			},
			allCardDesigns: {
				index: 'gsi1',
				type: 'isolated',
				pk: { field: 'gsi1pk', template: allItemsPKTemplate('cardDesign'), composite: [] },
				sk: { field: 'gsi1sk', composite: ['designId'] },
			},
			bySeason: {
				index: 'gsi2',
				type: 'clustered',
				collection: 'SeasonAndDesignsAndCards',
				pk: { field: 'gsi2pk', composite: ['seasonId'] },
				sk: { field: 'gsi2sk', composite: ['designId'] },
			},
		},
	},
	dbConfig
);

const CardInstances = new Entity(
	{
		model: { entity: 'cardInstance', version: '2', service: DB_SERVICE },
		attributes: {
			instanceId: { type: 'string', required: true },
			designId: { type: 'string', required: true },
			cardName: { type: 'string', required: true },
			cardDescription: { type: 'string', required: true },
			imgUrl: { type: 'string', required: true },
			seasonId: { type: 'string', required: true },
			seasonName: { type: 'string', required: true },
			rarityId: { type: 'string', required: true },
			rarityName: { type: 'string', required: true },
			rarityRank: { type: 'number', required: true },
			rarityRankPadded: {
				type: 'string',
				watch: ['rarityRank'],
				set: (_, { rarityRank }) => padNumberForSorting(rarityRank),
			},
			frameUrl: { type: 'string', required: true },
			rarityColor: { type: 'string', required: true },
			userId: { type: 'string' },
			username: { type: 'string' },
			minterId: { type: 'string' },
			minterUsername: { type: 'string' },
			packId: { type: 'string' },
			openedAt: { type: 'string' },
			cardNumber: { type: 'number', required: true },
			cardNumberPadded: {
				type: 'string',
				watch: ['cardNumber'],
				set: (_, { cardNumber }) => padNumberForSorting(cardNumber),
			},
			totalOfType: { type: 'number', required: true },
			stamps: { type: 'list', items: { type: 'string' } },
			tradeHistory: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						tradeId: { type: 'string', required: true },
						fromUserId: { type: 'string', required: true },
						fromUsername: { type: 'string', required: true },
						toUserId: { type: 'string', required: true },
						toUsername: { type: 'string', required: true },
						completedAt: { type: 'number', required: true },
						version: { type: 'number' },
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
			primary: {
				type: 'clustered',
				collection: 'DesignAndCards',
				pk: { field: 'pk', composite: ['designId'] },
				sk: { field: 'sk', composite: ['instanceId'] },
			},
			byDesignAndRarity: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: ['designId'] },
				sk: { field: 'gsi1sk', composite: ['rarityId', 'instanceId'] },
			},
			bySeason: {
				index: 'gsi2',
				type: 'clustered',
				collection: 'SeasonAndDesignsAndCards',
				pk: { field: 'gsi2pk', composite: ['seasonId'] },
				sk: { field: 'gsi2sk', composite: ['designId', 'instanceId'] },
			},
			byUser: {
				index: 'gsi3',
				type: 'clustered',
				collection: 'UserAndCards',
				pk: { field: 'gsi3pk', composite: ['username'] },
				sk: { field: 'gsi3sk', composite: ['instanceId'] },
			},
			byPackId: {
				index: 'gsi4',
				type: 'clustered',
				collection: 'PackAndCards',
				pk: { field: 'gsi4pk', composite: ['packId'] },
				sk: { field: 'gsi4sk', composite: ['instanceId'] },
			},
			byUserSortedByRarity: {
				index: 'gsi5',
				pk: { field: 'gsi5pk', composite: ['username'] },
				sk: {
					field: 'gsi5sk',
					composite: ['rarityRankPadded', 'cardName', 'cardNumberPadded'],
				},
			},
			byUserSortedByCardName: {
				index: 'gsi6',
				pk: { field: 'gsi6pk', composite: ['username'] },
				sk: {
					field: 'gsi6sk',
					composite: ['cardName', 'rarityRankPadded', 'cardNumberPadded'],
				},
			},
			byDesignSortedByRarity: {
				index: 'gsi7',
				pk: { field: 'gsi7pk', composite: ['designId'] },
				sk: {
					field: 'gsi7sk',
					composite: ['rarityRankPadded', 'cardName', 'cardNumberPadded'],
				},
			},
		},
	},
	dbConfig
);

export function padNumberForSorting(value: number) {
	return String(value).padStart(4, '0');
}

const MomentRedemptions = new Entity(
	{
		model: {
			entity: 'momentRedemption',
			version: '1',
			service: DB_SERVICE,
		},
		attributes: {
			momentDate: {
				type: 'string',
				default: () => new Date().toISOString().slice(0, 10),
				// cannot be modified after created
				readOnly: true,
			},
			userId: { type: 'string', required: true },
			username: { type: 'string', required: true },
			...auditAttributes('momentRedemption'),
		},
		indexes: {
			primary: {
				pk: { field: 'pk', composite: ['momentDate'] },
				sk: { field: 'sk', composite: ['userId'] },
			},
			allMomentRedemptions: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: [],
					template: allItemsPKTemplate('momentRedemption'),
				},
				sk: { field: 'gsi1sk', composite: ['momentDate', 'userId'] },
			},
		},
	},
	dbConfig
);

const PackTypes = new Entity(
	{
		model: { entity: 'packType', version: '1', service: DB_SERVICE },
		attributes: {
			packTypeId: { type: 'string', required: true },
			packTypeName: { type: 'string', required: true },
			packTypeDescription: { type: 'string' },
			packTypeCategory: { type: ['season', 'custom'] as const, required: true },
			cardCount: { type: 'number', required: true },
			seasonId: { type: 'string' },
			seasonName: { type: 'string' },
			designs: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						designId: { type: 'string', required: true },
						cardName: { type: 'string', required: true },
						imgUrl: { type: 'string', required: true },
					},
				},
			},
			...auditAttributes('packType'),
		},
		indexes: {
			primary: {
				pk: { field: 'pk', composite: ['packTypeId'] },
				sk: { field: 'sk', composite: [] },
			},
			allPackTypes: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: [], template: allItemsPKTemplate('packType') },
				sk: { field: 'gsi1sk', composite: ['packTypeId'] },
			},
			bySeason: {
				index: 'gsi2',
				pk: { field: 'gsi2pk', composite: ['seasonId'] },
				sk: { field: 'gsi2sk', composite: ['packTypeId'] },
			},
		},
	},
	dbConfig
);

const Packs = new Entity(
	{
		model: { entity: 'pack', version: '1', service: DB_SERVICE },
		attributes: {
			packId: { type: 'string', required: true },
			packTypeId: { type: 'string', required: true },
			packTypeName: { type: 'string', required: true },
			seasonId: { type: 'string' },
			username: { type: 'string' },
			userId: { type: 'string' },
			cardDetails: {
				type: 'list',
				required: true,
				items: {
					type: 'map',
					properties: {
						instanceId: { type: 'string', required: true },
						designId: { type: 'string', required: true },
						cardName: { type: 'string', required: true },
						cardDescription: { type: 'string', required: true },
						imgUrl: { type: 'string', required: true },
						rarityId: { type: 'string', required: true },
						rarityName: { type: 'string', required: true },
						rarityColor: { type: 'string', required: true },
						frameUrl: { type: 'string', required: true },
						opened: { type: 'boolean', required: true, default: false },
						cardNumber: { type: 'number', required: true },
						totalOfType: { type: 'number', required: true },
					},
				},
			},
			...auditAttributes('pack'),
		},
		indexes: {
			primary: {
				pk: { field: 'pk', composite: ['packId'] },
				sk: { field: 'sk', composite: [] },
			},
			allPacks: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: [], template: allItemsPKTemplate('pack') },
				sk: { field: 'gsi1sk', composite: ['packId'] },
			},
			byUsername: {
				index: 'gsi2',
				pk: { field: 'gsi2pk', composite: ['username'] },
				sk: { field: 'gsi2sk', composite: ['packId'] },
			},
			byPackId: {
				index: 'gsi4',
				type: 'clustered',
				collection: 'PackAndCards',
				pk: { field: 'gsi4pk', composite: ['packId'] },
				sk: { field: 'gsi4sk', composite: [] },
			},
		},
	},
	dbConfig
);

const Preorders = new Entity(
	{
		model: { entity: 'preorder', version: '1', service: DB_SERVICE },
		attributes: {
			preorderId: { type: 'string', required: true, default: randomUUID },
			userId: { type: 'string', required: true },
			username: { type: 'string', required: true },
			...auditAttributes('preorder'),
		},
		indexes: {
			primary: {
				pk: { field: 'pk', composite: ['preorderId'] },
				sk: { field: 'sk', composite: [] },
			},
			allPreorders: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: [], template: allItemsPKTemplate('preorder') },
				sk: { field: 'gsi1sk', composite: ['username', 'preorderId', 'createdAt'] },
			},
			byUser: {
				index: 'gsi3',
				type: 'clustered',
				collection: 'UserAndCards',
				pk: { field: 'gsi3pk', composite: ['username'] },
				sk: { field: 'gsi3sk', composite: ['preorderId'] },
			},
		},
	},
	dbConfig
);

const Rarities = new Entity(
	{
		model: { entity: 'rarity', version: '1', service: DB_SERVICE },
		attributes: {
			rarityId: { type: 'string', required: true },
			rarityName: { type: 'string', required: true },
			frameUrl: { type: 'string', required: true },
			defaultCount: { type: 'number', required: true },
			rarityColor: { type: 'string', required: true },
			...auditAttributes('rarity'),
		},
		indexes: {
			primary: {
				pk: { field: 'pk', composite: ['rarityId'] },
				sk: { field: 'sk', composite: [] },
			},
			allRarities: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: [], template: allItemsPKTemplate('rarity') },
				sk: { field: 'gsi1sk', composite: ['rarityId'] },
			},
		},
	},
	dbConfig
);

const Seasons = new Entity(
	{
		model: { entity: 'season', version: '1', service: DB_SERVICE },
		attributes: {
			seasonName: { type: 'string', required: true },
			seasonDescription: { type: 'string' },
			seasonId: { type: 'string', required: true },
			...auditAttributes('season'),
		},
		indexes: {
			primary: {
				pk: { field: 'pk', composite: ['seasonId'] },
				sk: { field: 'sk', composite: [] },
			},
			allSeasons: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: [], template: allItemsPKTemplate('season') },
				sk: { field: 'gsi1sk', composite: ['seasonId'] },
			},
			bySeason: {
				type: 'clustered',
				collection: 'SeasonAndDesignsAndCards',
				index: 'gsi2',
				pk: { field: 'gsi2pk', composite: ['seasonId'] },
				sk: { field: 'gsi2sk', composite: [] },
			},
		},
	},
	dbConfig
);

const SiteConfig = new Entity(
	{
		model: { entity: 'siteConfig', version: '1', service: DB_SERVICE },
		attributes: {
			baseRarity: {
				type: 'map',
				required: true,
				properties: {
					rarityId: { type: 'string', required: true },
					frameUrl: { type: 'string', required: true },
					rarityColor: { type: 'string', required: true },
					rarityName: { type: 'string', required: true },
				},
			},
			messages: {
				type: 'list',
				required: true,
				items: {
					type: 'map',
					properties: {
						message: { type: 'string', required: true },
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
						rarityId: { type: 'string', required: true },
						rarityName: { type: 'string', required: true },
						ranking: { type: 'number', required: true },
					},
				},
			},
			tradingIsEnabled: { type: 'boolean' },
			faq: { type: 'string' },
			...auditAttributes('siteConfig'),
		},
		indexes: {
			primary: {
				pk: { field: 'pk', composite: [], template: allItemsPKTemplate('siteConfig') },
				sk: { field: 'sk', composite: [] },
			},
		},
	},
	dbConfig
);

const tradeCardsProperties = {
	instanceId: { type: 'string', required: true },
	designId: { type: 'string', required: true },
	cardName: { type: 'string', required: true },
	cardDescription: { type: 'string', required: true },
	imgUrl: { type: 'string', required: true },
	rarityId: { type: 'string', required: true },
	rarityName: { type: 'string', required: true },
	rarityColor: { type: 'string', required: true },
	frameUrl: { type: 'string', required: true },
	cardNumber: { type: 'number', required: true },
	totalOfType: { type: 'number', required: true },
	stamps: { type: 'list', items: { type: 'string' } },
} as const;

const Trades = new Entity(
	{
		model: { entity: 'trade', version: '1', service: DB_SERVICE },
		attributes: {
			tradeId: { type: 'string', default: () => randomUUID(), required: true },
			senderUserId: { type: 'string', required: true },
			senderUsername: { type: 'string', required: true },
			receiverUserId: { type: 'string', required: true },
			receiverUsername: { type: 'string', required: true },
			offeredCards: {
				type: 'list',
				required: true,
				items: { type: 'map', properties: tradeCardsProperties },
			},
			requestedCards: {
				type: 'list',
				required: true,
				items: { type: 'map', properties: tradeCardsProperties },
			},
			notificationsForSender: { type: 'list', items: { type: 'string' } },
			notificationsForReceiver: { type: 'list', items: { type: 'string' } },
			messages: {
				type: 'list',
				required: true,
				items: {
					type: 'map',
					properties: {
						userId: { type: 'string', required: true },
						message: { type: 'string', required: true },
						type: {
							type: ['offer', 'response', 'status-update', 'message'] as const,
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
			statusMessage: { type: 'string' },
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
				pk: { field: 'pk', composite: ['tradeId'] },
				sk: { field: 'sk', composite: [] },
			},
			bySenderId: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: ['senderUserId'] },
				sk: { field: 'gsi1sk', composite: ['tradeId'] },
			},
			byReceiverId: {
				index: 'gsi2',
				pk: { field: 'gsi2pk', composite: ['receiverUserId'] },
				sk: { field: 'gsi2sk', composite: ['tradeId'] },
			},
		},
	},
	dbConfig
);

const TwitchEventMessageHistory = new Entity(
	{
		model: { entity: 'twitchEventMessageHistory', version: '1', service: DB_SERVICE },
		attributes: {
			message_id: { type: 'string', required: true },
			message_timestamp: { type: 'string', required: true },
			...auditAttributes('twitchEventMessageHistory'),
		},
		indexes: {
			byMessageId: {
				pk: { field: 'pk', composite: ['message_id'] },
				sk: { field: 'sk', composite: [] },
			},
		},
	},
	dbConfig
);

export const twitchEventTypes = [
	'channel.channel_points_custom_reward_redemption.add',
	'channel.subscription.gift',
] as const;
const TwitchEvents = new Entity(
	{
		model: { entity: 'twitchEvents', version: '1', service: DB_SERVICE },
		attributes: {
			eventId: { type: 'string', required: true },
			eventName: { type: 'string', required: true },
			eventType: { type: twitchEventTypes, required: true },
			packTypeId: { type: 'string' },
			packTypeName: { type: 'string' },
			cost: { type: 'number' },
			isEnabled: { type: 'boolean' },
			isPaused: { type: 'boolean' },
			...auditAttributes('twitchEvents'),
		},
		indexes: {
			byEventId: {
				pk: { field: 'pk', composite: [], template: allItemsPKTemplate('twitchEvents') },
				sk: { field: 'sk', composite: ['eventId', 'eventType'] },
			},
		},
	},
	dbConfig
);

const UnmatchedImages = new Entity(
	{
		model: { entity: 'unmatchedImage', version: '1', service: DB_SERVICE },
		attributes: {
			imageId: { type: 'string', required: true },
			url: { type: 'string', required: true },
			unmatchedImageType: { type: ['cardDesign', 'frame'] as const, required: true },
			...auditAttributes('unmatchedImage'),
		},
		indexes: {
			byType: {
				pk: { field: 'pk', composite: ['unmatchedImageType'] },
				sk: { field: 'sk', composite: ['imageId'] },
			},
		},
	},
	dbConfig
);

const UserLogins = new Entity(
	{
		model: { entity: 'userLogin', version: '1', service: DB_SERVICE },
		attributes: {
			userId: { type: 'string', required: true, label: 'userId' },
			username: { type: 'string', required: true },
			hasProfile: { type: 'boolean' },
			...auditAttributes('userLogin'),
		},
		indexes: {
			primary: {
				pk: { field: 'pk', composite: ['userId'] },
				sk: { field: 'sk', composite: [] },
			},
			allLogins: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: [], template: allItemsPKTemplate('userLogin') },
				sk: { field: 'gsi1sk', composite: ['userId'] },
			},
			byUsername: {
				index: 'gsi3',
				type: 'clustered',
				collection: 'UserAndCards',
				pk: { field: 'gsi3pk', composite: ['username'] },
				sk: { field: 'gsi3sk', composite: [] },
			},
		},
	},
	dbConfig
);

const Users = new Entity(
	{
		model: { entity: 'user', version: '1', service: DB_SERVICE },
		attributes: {
			userId: { type: 'string', required: true },
			ownerId: { type: 'string', watch: ['userId'], get: (_, { userId }) => userId },
			username: { type: 'string', required: true },
			cardCount: { type: 'number', required: true, default: 0 },
			packCount: { type: 'number', required: true, default: 0 },
			lookingFor: { type: 'string' },
			isTrading: { type: 'boolean' },
			tradeNotifications: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						status: { type: ['statusUpdated', 'newMessage'] as const },
						tradeId: { type: 'string', required: true },
						text: { type: 'string' },
						createdAt: { type: 'number', default: () => Date.now(), readOnly: true },
					},
				},
			},
			pinnedCard: {
				type: 'map',
				properties: {
					instanceId: { type: 'string', required: true },
					designId: { type: 'string', required: true },
					cardName: { type: 'string', required: true },
					cardDescription: { type: 'string', required: true },
					imgUrl: { type: 'string', required: true },
					rarityId: { type: 'string', required: true },
					rarityName: { type: 'string', required: true },
					rarityColor: { type: 'string', required: true },
					frameUrl: { type: 'string', required: true },
					cardNumber: { type: 'number', required: true },
					totalOfType: { type: 'number', required: true },
					stamps: { type: 'list', items: { type: 'string' } },
				},
			},
			...auditAttributes('user'),
		},
		indexes: {
			byId: {
				pk: { field: 'pk', composite: ['userId'] },
				sk: { field: 'sk', composite: [] },
			},
			allUsers: {
				index: 'gsi1',
				pk: { field: 'gsi1pk', composite: [], template: allItemsPKTemplate('user') },
				sk: { field: 'gsi1sk', composite: ['userId'] },
			},
			byUsername: {
				index: 'gsi3',
				type: 'clustered',
				collection: 'UserAndCards',
				pk: { field: 'gsi3pk', composite: ['username'] },
				sk: { field: 'gsi3sk', composite: [] },
			},
		},
	},
	dbConfig
);

export const db = new Service(
	{
		Admins,
		CardDesigns,
		CardInstances,
		MomentRedemptions,
		Packs,
		PackTypes,
		Preorders,
		Rarities,
		Seasons,
		SiteConfig,
		Trades,
		TwitchEventMessageHistory,
		TwitchEvents,
		UnmatchedImages,
		UserLogins,
		Users,
	},
	dbConfig
);
