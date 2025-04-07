export const wsConnectionsTable = new sst.aws.Dynamo('WebsocketApiConnectionsTable', {
	fields: { id: 'string' },
	primaryIndex: { hashKey: 'id' },
});

export const wsApi = new sst.aws.ApiGatewayWebSocket('WebsocketApi');
wsApi.route('$connect', {
	handler: 'packages/functions/src/ws/connect.main',
	link: [wsConnectionsTable, wsApi],
});
wsApi.route('$disconnect', {
	handler: 'packages/functions/src/ws/disconnect.main',
	link: [wsConnectionsTable, wsApi],
});
wsApi.route('sendmessage', {
	handler: 'packages/functions/src/ws/sendMessage.main',
	link: [wsConnectionsTable, wsApi],
});
