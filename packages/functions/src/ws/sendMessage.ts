import { WebSocketApiHandler } from 'sst/node/websocket-api';
import { broadcastMessage } from '@core/lib/ws';
//import { useSession } from 'sst/node/future/auth';

export const main = WebSocketApiHandler(async event => {
	console.log('REQUEST CONTEXT', {
		stage: event.requestContext.stage,
		domainName: event.requestContext.domainName,
	});

	let result = await broadcastMessage({
		messageData: 'REFRESH_PACKS',
	});

	if (!result.success) {
		console.error(result.error);
		return { statusCode: 500, body: 'Internal Server Error' };
	}

	console.log({ result });

	return { statusCode: 200, body: 'Message sent' };
});
