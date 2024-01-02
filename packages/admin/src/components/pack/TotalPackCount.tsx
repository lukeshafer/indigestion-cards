import { setTotalPackCount, totalPackCount } from '@/lib/client/state';
import { API } from '@/constants';
import { Show, createEffect, createResource } from 'solid-js';

export default function TotalPackCount(props: { count: number }) {
	const [packCountResource] = createResource(
		totalPackCount,
		async () => {
			const response = await fetch(API.PACK_COUNT);
			if (!response?.ok) return 0;
			const responseBody = await response.json();
			if (!responseBody.packCount || typeof responseBody.packCount !== 'number') return 0;
			return responseBody.packCount as number;
		},
		// eslint-disable-next-line solid/reactivity
		{ initialValue: props.count }
	);

	createEffect(() => setTotalPackCount(packCountResource()));

	return (
		<Show when={packCountResource() > 0}>
			<span class="no-text-shadow absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-black">
				{packCountResource()}
			</span>
		</Show>
	);
}
