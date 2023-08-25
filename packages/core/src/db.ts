import { Table } from 'sst/node/table';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { type Attribute, EntityConfiguration, Entity, Service } from 'electrodb';

export const config = {
	table: Table.data.tableName,
	client: new DocumentClient(),
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
					process.env.SESSION_TYPE !== 'admin' ||
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

const cardDesigns = new Entity(
	{
		model: {
			entity: 'cardDesign',
			version: '1',
			service: 'card-app',
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
		},
	},
	config
);

const season = new Entity(
	{
		model: {
			entity: 'season',
			version: '1',
			service: 'card-app',
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

const cardInstances = new Entity(
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

const users = new Entity(
	{
		model: {
			entity: 'user',
			version: '1',
			service: 'card-app',
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

const packs = new Entity(
	{
		model: {
			entity: 'pack',
			version: '2',
			service: 'card-app',
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

export type UnmatchedImageType = 'cardDesign' | 'frame';
const unmatchedImages = new Entity(
	{
		model: {
			entity: 'unmatchedImage',
			version: '1',
			service: 'card-app',
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

const rarities = new Entity(
	{
		model: {
			entity: 'rarity',
			version: '1',
			service: 'card-app',
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

const admins = new Entity(
	{
		model: {
			entity: 'admin',
			version: '1',
			service: 'card-app',
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

const packTypes = new Entity(
	{
		model: {
			entity: 'packType',
			version: '1',
			service: 'card-app',
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

export const twitchEventTypes = [
	'channel.channel_points_custom_reward_redemption.add',
	'channel.subscription.gift',
] as const;

const twitchEvents = new Entity(
	{
		model: {
			entity: 'twitchEvents',
			version: '1',
			service: 'card-app',
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

const twitchEventMessageHistory = new Entity(
	{
		model: {
			entity: 'twitchEventMessageHistory',
			version: '1',
			service: 'card-app',
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

const audits = new Entity(
	{
		model: {
			entity: 'audit',
			version: '1',
			service: 'card-app',
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

const siteConfig = new Entity(
	{
		model: {
			entity: 'siteConfig',
			version: '1',
			service: 'card-app',
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

export const db = new Service(
	{
		cardDesigns,
		season,
		cardInstances,
		packs,
		packTypes,
		users,
		unmatchedImages,
		rarities,
		admins,
		twitchEvents,
		twitchEventMessageHistory,
		siteConfig,
	},
	config
);
