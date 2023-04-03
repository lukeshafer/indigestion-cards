import { Table } from 'sst/node/table'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const dynamo = new DocumentClient()

export interface User {
	userId: string
	userName: string
}

export async function getUser(userId: string) {
	const params: DocumentClient.GetItemInput = {
		TableName: Table.table.tableName,
		Key: {
			pk: `u#${userId}`,
			sk: `u#${userId}`,
		},
	}
	return dynamo
		.get(params)
		.promise()
		.then(({ Item }) => Item)
}

export async function getUserByUserName(userName: string) {
	const params: DocumentClient.QueryInput = {
		TableName: Table.table.tableName,
		IndexName: 'byUserName',
		ExpressionAttributeValues: {
			':userName': userName,
		},
		KeyConditionExpression: 'userName = :userName',
	}
	return dynamo
		.query(params)
		.promise()
		.then(({ Items }) => Items?.[0])
}

export async function putUser(user: {
	userId: string
	userName: string
	unopenedPacks?: number
}) {
	const params: DocumentClient.PutItemInput = {
		TableName: Table.table.tableName,
		Item: {
			pk: `u#${user.userId}`,
			sk: `u#${user.userId}`,
			entityType: 'user',
			userId: user.userId,
			userName: user.userName,
			unopenedPacks: user.unopenedPacks ?? 0,
		},
	}

	return dynamo.put(params).promise()
}

export async function createNewUser(user: {
	userId: string
	userName: string
}) {
	if (await checkIfUsernameExists(user.userName)) {
		// TODO: update existing username, as they likely changed their username
	}

	console.log('creating user', user)
	const result = await putUser(user)
	console.log('created user', result)
}

export async function checkIfUserExists(userId: string): Promise<boolean> {
	return getUser(userId).then((user) => !!user)
}

export async function checkIfUsernameExists(
	userName: string
): Promise<boolean> {
	return getUserByUserName(userName).then((user) => !!user)
}

export async function addUnopenedPacks(args: {
	userId: string
	packCount: number
}) {
	const params: DocumentClient.UpdateItemInput = {
		TableName: Table.table.tableName,
		Key: {
			pk: `u#${args.userId}`,
			sk: `u#${args.userId}`,
		},
		UpdateExpression: 'ADD unopenedPacks :packs',
		ExpressionAttributeValues: {
			':packs': args.packCount,
		},
	}
	return dynamo
		.update(params)
		.promise()
		.then(({ Attributes }) => Attributes)
}

export async function getAllUsersWithUnopenedPacks() {
	// search for items with pk starting with u#, sk starting with u#, and unopenedPacks > 0
	const params: DocumentClient.QueryInput = {
		TableName: Table.table.tableName,
		ExpressionAttributeValues: {
			':pk': 'u#',
			':sk': 'u#',
			':unopenedPacks': 0,
		},
		KeyConditionExpression: 'pk >= :pk AND sk >= :sk',
		FilterExpression: 'unopenedPacks > :unopenedPacks',
	}
	return dynamo
		.query(params)
		.promise()
		.then(({ Items }) => Items)
}
