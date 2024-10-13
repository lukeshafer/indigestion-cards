import { StackContext, WebSocketApi, Table } from 'sst/constructs';

export function WebsocketsAPI({ stack }: StackContext) {
	const wsConnectionsTable = new Table(stack, 'WebsocketApiConnectionsTable', {
		fields: {
			id: 'string',
		},
		primaryIndex: { partitionKey: 'id' },
	});

	const wsApi = new WebSocketApi(stack, 'WebsocketApi', {
		defaults: {
			function: {
				bind: [wsConnectionsTable],
			},
		},
		routes: {
			$connect: 'packages/functions/src/ws/connect.main',
			$disconnect: 'packages/functions/src/ws/disconnect.main',
			sendmessage: 'packages/functions/src/ws/sendMessage.main',
		},
	});

  wsApi.bind([ wsApi ]);

	stack.addOutputs({
		WebsocketApiEndpoint: wsApi.url,
	});

	return { wsApi };
}
