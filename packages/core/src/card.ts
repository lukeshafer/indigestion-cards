import { Table } from 'sst/node/table'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Entity } from 'electrodb'

const docClient = new DocumentClient()

interface CardType {
	cardName: string
	cardDescription: string
	releaseDate: Date
	seriesId: string
	cardTypeId: string
	totalCardInstances: number
	cardImage: string
}

interface CardSeries {
	seriesName: string
	seriesDescription?: string
	seriesImage?: string
	seriesId: string
}

export async function createCardType(cardType: CardType) {
	const params: DocumentClient.PutItemInput = {
		TableName: Table.table.tableName,
		Item: {
			cardName: cardType.cardName,
			cardDescription: cardType.cardDescription,
			entityType: 'cardType',
			releaseDate: cardType.releaseDate.toISOString(),
			totalCardInstances: cardType.totalCardInstances,
			cardImage: cardType.cardImage,
		},
	}
	return docClient.put(params).promise()
}

async function getNextCardTypeId(seriesId: string) {
	// get the latest cardTypeId for the seriesId
	// pk = cs#seriesId
	// sk = ct#cardTypeId
	const params: DocumentClient.QueryInput = {
		TableName: Table.table.tableName,
		KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
		ExpressionAttributeValues: {
			':pk': `cs#${seriesId}`,
			':sk': 'ct#',
		},
		ScanIndexForward: false,
		Limit: 1,
	}

	const result = await docClient.query(params).promise()

	const cardTypeId =
		result.Items && result.Items.length > 0
			? result.Items[0].sk.split('#')[1]
			: '0'
	const nextCardTypeId = parseInt(cardTypeId) + 1

	// return new Id padded with 0s to 4 digits
	return nextCardTypeId.toString().padStart(4, '0')
}

export async function createSeries(series: CardSeries) {
	const params: DocumentClient.PutItemInput = {
		TableName: Table.table.tableName,
		Item: {
			seriesName: series.seriesName,
			seriesDescription: series.seriesDescription,
			seriesImage: series.seriesImage,
			entityType: 'series',
			seriesId: series.seriesId,
		},
	}
	return docClient.put(params).promise()
}
