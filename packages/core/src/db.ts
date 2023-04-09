import { Table } from 'sst/node/table'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Entity, Service } from 'electrodb'

const config = {
	table: Table.data.tableName,
	client: new DocumentClient(),
}

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
			seriesId: {
				type: 'string',
				required: true,
			},
			releaseDate: {
				type: 'string',
			},
			isComplete: {
				type: 'boolean',
			},
			rarityDetails: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						rarityLevel: {
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
				collection: 'designsAndCards',
				pk: {
					field: 'pk',
					composite: ['designId'],
				},
				sk: {
					field: 'sk',
					composite: [],
				},
			},
			bySeriesId: {
				index: 'gsi1',
				collection: 'seriesAndDesigns',
				pk: {
					field: 'gsi1pk',
					composite: ['seriesId'],
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
)

const cardSeries = new Entity(
	{
		model: {
			entity: 'cardSeries',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			seriesName: {
				type: 'string',
				required: true,
			},
			seriesDescription: {
				type: 'string',
			},
			seriesId: {
				type: 'string',
				required: true,
			},
		},
		indexes: {
			allSeries: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['seriesId'],
				},
			},
			bySeriesId: {
				collection: 'seriesAndDesigns',
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['seriesId'],
				},
				sk: {
					field: 'gsi1sk',
					composite: [],
				},
			},
		},
	},
	config
)

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
			seriesId: {
				type: 'string',
				required: true,
			},
			rarityLevel: {
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
			minterId: {
				type: 'string',
				required: true,
			},
			minterUsername: {
				type: 'string',
				required: true,
			},
			packId: {
				type: 'string',
			},
			openedAt: {
				type: 'string',
			},
		},
		indexes: {
			byDesignId: {
				collection: 'designsAndCards',
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
				index: 'gsi1',
				collection: 'cardsByOwnerName',
				pk: {
					field: 'gsi1pk',
					composite: ['username'],
				},
				sk: {
					field: 'gsi1sk',
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
		},
	},
	config
)

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
		},
		indexes: {
			byUserId: {
				collection: 'cardsByOwner',
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
				index: 'gsi1',
				collection: 'cardsByOwnerName',
				pk: {
					field: 'gsi1pk',
					composite: ['username'],
				},
				sk: {
					field: 'gsi1sk',
					composite: [],
				},
			},
		},
	},
	config
)

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
			seriesId: {
				type: 'string',
				required: true,
			},
			username: {
				type: 'string',
				required: true,
			},
			userId: {
				type: 'string',
				required: true,
			},
			cardDetails: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						instanceId: {
							type: 'string',
							required: true,
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
)

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
		},
		indexes: {
			allImages: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['imageId'],
				},
			},
		},
	},
	config
)

export const db = new Service(
	{
		cardDesigns,
		cardSeries,
		cardInstances,
		packs,
		users,
		unmatchedImages,
	},
	config
)

//const username = 'snailyluke'
//const seriesId = 'series-1'
//const designId = 'design-1'
//const instanceId = 'instance-1'
//const packId = 'pack-1'
//const userId = 'user-1'

//[>
//As a user, I need to find all of the CARDS my USER owns
//As a user, I need to see all of the CARD DESIGNS in a given SERIES
//As a user, I need to see all of the CARDS and their OWNERS for a given CARD DESIGN
//As a user, I need to see all of the TRADES made to my USER and other USERS
//As a user, I need to see all of the SERIES released
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

//// As a user, I need to see all of the CARD DESIGNS in a given SERIES
//const designsInSeries = db.collections
//.seriesAndDesigns({
//seriesId,
//})
//.go()

//// As a user, I need to see all of the CARDS for a given CARD DESIGN
//const cardsInDesign = db.collections
//.designsAndCards({
//designId,
//})
//.go()

//// As a user, I need to see all of the TRADES made between my USER and other USERS
//// TODO: Trades will be added in a future release

//// As a user, I need to see all of the SERIES released
//const allSeries = db.entities.cardSeries.query.allSeries({}).go()

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
