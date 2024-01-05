import { cardDesigns } from '@lil-indigestion-cards/core/db/cardDesigns';

export function createDbStream<T>(
	callback: (opts: {
		cursor: string | null | undefined;
	}) => Promise<{ data: T; cursor: string | null | undefined }>,
	name?: string
): ReadableStream<T> {
	return new ReadableStream<T>({
		async start(controller) {
			let prevCursor: string | null | undefined = undefined;
			let count = 0;
			while (true) {
				console.log(`Reading Stream ${name || ''}`, ++count);
				const { data, cursor } = await callback({ cursor: prevCursor });
				controller.enqueue(data);

				if (cursor === null) break;
				prevCursor = cursor;
			}
			controller.close();
		},
	});
}

export function streamAllCardDesigns() {
	return createDbStream(cardDesigns.query.allDesigns({}).go, 'Card Designs');
}

export function mapStream<T, S>(stream: ReadableStream<T>, cb: (value: T) => S): ReadableStream<S> {
	const reader = stream.getReader();
	return new ReadableStream({
		async start(controller) {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				controller.enqueue(cb(value));
			}
			controller.close();
			reader.releaseLock();
		},
	});
}
