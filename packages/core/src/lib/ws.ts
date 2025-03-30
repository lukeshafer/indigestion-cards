import {
	DeleteItemCommand,
	DynamoDBClient,
	PutItemCommand,
	ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { Table } from 'sst/node/table';
import { LibraryFn, Unwrap } from './utils';
import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
import { WebSocketApi } from 'sst/node/websocket-api';

const dynamoDb = new DynamoDBClient();

export const addConnection = LibraryFn(async (args: { connectionId: string }) =>
	dynamoDb.send(
		new PutItemCommand({
			Item: {
				id: {
					S: args.connectionId,
				},
			},
			TableName: Table.WebsocketApiConnectionsTable.tableName,
		})
	)
);

export const removeConnection = LibraryFn((args: { connectionId: string }) =>
	dynamoDb.send(
		new DeleteItemCommand({
			Key: {
				id: {
					S: args.connectionId,
				},
			},
			TableName: Table.WebsocketApiConnectionsTable.tableName,
		})
	)
);

export const getAllConnections = LibraryFn(async () => {
	const dbResult = await dynamoDb.send(
		new ScanCommand({ TableName: Table.WebsocketApiConnectionsTable.tableName })
	);

	return dbResult.Items?.map(item => ({ id: item.id.S! })) ?? [];
});

export const sendMessage = LibraryFn(
	async (args: {
		connectionId: string;
		messageData: MessageType;
		apiGatewayManagementApi?: ApiGatewayManagementApi;
	}) => {
		const apiG =
			args.apiGatewayManagementApi ??
			new ApiGatewayManagementApi({ endpoint: WebSocketApi.WebsocketApi.httpsUrl });

		try {
			// Send the message to the given client
			await apiG.postToConnection({
				ConnectionId: args.connectionId,
				Data: args.messageData,
			});
		} catch (e) {
			if (typeof e === 'object' && e && 'statusCode' in e && e.statusCode === 410) {
				// Remove stale connections
				await removeConnection(args);
			}

			throw e;
		}
	}
);

export const broadcastMessage = LibraryFn(async (args: { messageData: MessageType }) => {
	const apiGatewayManagementApi = new ApiGatewayManagementApi({
		endpoint: WebSocketApi.WebsocketApi.httpsUrl,
	});

	const connections = await Unwrap(getAllConnections());
	console.log({ connections });

	const promises = connections.map(item =>
		Unwrap(
			sendMessage({
				messageData: args.messageData,
				connectionId: item.id,
				apiGatewayManagementApi,
			})
		)
	);

	return await Promise.all(promises);
});

// const messageTypes = ['REFRESH_PACKS'] as const;
export type MessageType = ('REFRESH_PACKS')[number];
