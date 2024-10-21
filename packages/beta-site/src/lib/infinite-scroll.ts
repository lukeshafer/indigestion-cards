import { createStore, produce } from 'solid-js/store';

type InfiniteScrollCallback<T> = (cursor?: string) => Promise<{
	data: Array<T>;
	cursor?: string | null | undefined;
}>;

export function createInfiniteScroll<T>(cb: InfiniteScrollCallback<T>) {
	const [internalStore, setInternalStore] = createStore<{
		data: Array<T>;
		cursor: string | null | undefined;
	}>({ data: [], cursor: undefined });

	cb().then(value => {
		setInternalStore('data', value.data);
		setInternalStore('cursor', value.cursor);
	});

	return {
		get data() {
			return internalStore.data;
		},

		loadNext() {
			if (!internalStore.cursor) return Promise.resolve();
			return cb(internalStore.cursor).then(result => {
				setInternalStore(
					'data',
					produce(array => {
						array.push(...result.data);
					})
				);

				setInternalStore('cursor', result.cursor || undefined);
			});
		},

		get isComplete() {
			return !internalStore.cursor;
		},
	};
}
