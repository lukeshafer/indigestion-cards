import type { MessageType } from '@core/lib/ws';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@site/server/api';
import { resolveLocalPath } from '@site/constants';

export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: resolveLocalPath('/trpc'),
		}),
	],
});

export function createWSClient(options: {
	onopen?: WebSocket['onopen'];
	onclose?: WebSocket['onclose'];
	onerror?: WebSocket['onerror'];
	onmessage?: {
		[messageType in MessageType]?: NonNullable<WebSocket['onmessage']>;
	};
}) {
	const wsUrl = import.meta.env.PUBLIC_WS_URL;
	if (!wsUrl) {
		console.error('Websocket URL is undefined.');
		return null;
	}

	const ws = new WebSocket(wsUrl);
	ws.onopen = options.onopen ?? null;
	ws.onclose = options.onclose ?? null;
	ws.onerror = options.onerror ?? null;

	const messageCallbacks = options.onmessage;
	if (messageCallbacks) {
		ws.onmessage = event => {
			const messageType = event.data;
			if (!checkIsKey(messageType, messageCallbacks)) return;

			const callback = messageCallbacks[messageType];
			callback?.bind(ws)(event);
		};
	}

  return ws;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkIsKey<T extends Record<any, any>>(key: any, object: T): key is keyof T {
	return key in object;
}
