import { addConnection } from '@core/lib/ws';
import { WebSocketApiHandler } from 'sstv2/node/websocket-api';

export const main = WebSocketApiHandler(async event => {
	let connectionId = event.requestContext.connectionId;
	if (!connectionId) {
		return { statusCode: 400, body: 'Invalid request.' };
	}

	let { success, error } = await addConnection({ connectionId });

	if (success) {
		return { statusCode: 200, body: 'Connected' };
	} else {
		console.error('An error occurred during the connection creation process.', { error });
		return { statusCode: 500, body: 'An unknown error occurred.' };
	}
});
