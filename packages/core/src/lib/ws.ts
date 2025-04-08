import {
	DeleteItemCommand,
	DynamoDBClient,
	PutItemCommand,
	ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { Resource } from 'sst';
import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
import type { LibraryOutput } from '../session.types';

const dynamoDb = new DynamoDBClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LibraryFn<CB extends (...args: any[]) => any>(
	cb: CB
): (...args: Parameters<CB>) => Promise<LibraryOutput<Awaited<ReturnType<CB>>>> {
	return async (...args: Parameters<CB>) => {
		try {
			return { success: true, data: await cb(...args) };
		} catch (error) {
			return { success: false, error };
		}
	};
}

export function Unwrap<Data>(libraryOutput: Promise<LibraryOutput<Data>>): Promise<Data> {
	return libraryOutput.then(item => {
		if (item.success) {
			return item.data;
		} else {
			throw item.error;
		}
	});
}

export const addConnection = LibraryFn(async (args: { connectionId: string }) =>
	dynamoDb.send(
		new PutItemCommand({
			Item: {
				id: {
					S: args.connectionId,
				},
			},
			TableName: Resource.WebsocketApiConnectionsTable.name,
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
			TableName: Resource.WebsocketApiConnectionsTable.name,
		})
	)
);

export const getAllConnections = LibraryFn(async () => {
	const dbResult = await dynamoDb.send(
		new ScanCommand({ TableName: Resource.WebsocketApiConnectionsTable.name })
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
			new ApiGatewayManagementApi({ endpoint: Resource.WebsocketApi.url });

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
		endpoint: Resource.WebsocketApi.url,
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
