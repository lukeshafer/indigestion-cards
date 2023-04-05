import { Table } from 'sst/node/table'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Entity, Service } from 'electrodb'

const config = {
	table: Table.db.tableName,
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
				collection: 'cardsByDesign',
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
				collection: 'cardsBySeries',
				pk: {
					field: 'gsi1pk',
					composite: ['seriesId'],
				},
				sk: {
					field: 'gsi1sk',
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
			bySeriesId: {
				collection: 'cardsBySeries',
				pk: {
					field: 'pk',
					composite: ['seriesId'],
				},
				sk: {
					field: 'sk',
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
			ownerId: {
				type: 'string',
				required: true,
			},
			minterId: {
				type: 'string',
				required: true,
			},
			openedAt: {
				type: 'string',
			},
		},
		indexes: {
			byOwnerId: {
				collection: 'cardsByOwner',
				pk: {
					field: 'pk',
					composite: ['ownerId'],
				},
				sk: {
					field: 'sk',
					composite: ['instanceId'],
				},
			},
			byDesignId: {
				index: 'gsi1',
				collection: 'cardsByDesign',
				pk: {
					field: 'gsi1pk',
					composite: ['designId'],
				},
				sk: {
					field: 'gsi1sk',
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
			ownerId: {
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
			byOwnerId: {
				pk: {
					field: 'pk',
					composite: ['ownerId'],
				},
				sk: {
					field: 'sk',
					composite: ['packId'],
				},
			},
			bySeriesId: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['seriesId'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['packId'],
				},
			},
		},
	},
	config
)

const app = new Service(
	{
		cardDesigns,
		cardSeries,
		cardInstances,
		users,
		packs,
	},
	config
)

users.put({
	userId: 'user1',
	username: 'user1',
})
