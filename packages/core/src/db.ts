import { Table } from 'sst/node/table';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Entity, Service } from 'electrodb';

const config = {
	table: Table.data.tableName,
	client: new DocumentClient(),
};

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
					},
				},
			},
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
			version: '1',
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
						frameUrl: {
							type: 'string',
							required: true,
						},
						opened: {
							type: 'boolean',
							required: true,
							default: false,
						},
					},
				},
			},
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

const admins = new Entity({
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
				composite: ['userId'],
			},
		},
	},
});

const packTypes = new Entity({
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
});

export const twitchEventTypes = [
	'channel.channel_points_custom_reward_redemption.add',
	'channel.subscription.gift',
] as const;

const twitchEvents = new Entity({
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
});

const twitchEventMessageHistory = new Entity({
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
});

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
	},
	config
);

//const username = 'snailyluke'
//const seasonId = 'season-1'
//const designId = 'design-1'
//const instanceId = 'instance-1'
//const packId = 'pack-1'
//const userId = 'user-1'

//[>
//As a user, I need to find all of the CARDS my USER owns
//As a user, I need to see all of the CARD DESIGNS in a given SEASON
//As a user, I need to see all of the CARDS and their OWNERS for a given CARD DESIGN
//As a user, I need to see all of the TRADES made to my USER and other USERS
//As a user, I need to see all of the SEASON released
//As a user, I need to find a USER based on their USERNAME
//As a user, I need to see how many UNOPENED PACKS I (USER) have earned
//As an admin, I need to see all of the UNOPENED PACKS earned by ALL USERS
//*/

//// As a user, I need to find all of the CARDS my USER owns
//const myCards = db.collections
//.cardsByOwnerName({
//username,
//})
//.go()

//// As a user, I need to see all of the CARD DESIGNS in a given SEASON
//const designsInSeason = db.collections
//.s easonAndDesigns({
//seasonId,
//})
//.go()

//// As a user, I need to see all of the CARDS for a given CARD DESIGN
//const cardsInDesign = db.collections
//.designsAndCards({
//designId,
//})
//.go()

//// As a user, I need to see all of the TRADES made between my USER and other USERS
//// TODO Trades will be added in a future release

//// As a user, I need to see all of the SEASONS released
//const allSeasons = db.entities.season.query.allSeasons({}).go()

//// As a user, I need to find a USER based on their USERNAME
//const user = db.entities.users.query.byUsername({
//username,
//})

//// As a user, I need to see how many UNOPENED PACKS I (USER) have earned
//const unopenedPacks = db.entities.packs.query
//.byUsername({
//username,
//})
//.go()

//// As an admin, I need to see all of the UNOPENED PACKS earned by ALL users
//const allUnopenedPacks = db.entities.packs.query.allPacks({
//entityType: 'pack',
//})
