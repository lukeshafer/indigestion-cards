import { removeConnection } from '@core/lib/ws';
import { WebSocketApiHandler } from 'sst/node/websocket-api';
//import { useSession } from 'sst/node/future/auth';

export const main = WebSocketApiHandler(async event => {
	//let session = useSession();
	//if (session.type !== 'admin') {
	//	return { statusCode: 401, body: 'Unauthorized.' };
	//}
	//
	let connectionId = event.requestContext.connectionId;
	if (!connectionId) {
		return { statusCode: 400, body: 'Invalid request.' };
	}

	let { success, error } = await removeConnection({ connectionId });

	if (success) {
		return { statusCode: 200, body: 'Disconnected' };
	} else {
		console.error('An error occurred during the connection creation process.', { error });
		return { statusCode: 500, body: 'An unknown error occurred.' };
	}
});
