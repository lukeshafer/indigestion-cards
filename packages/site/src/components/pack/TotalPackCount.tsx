import { setTotalPackCount, totalPackCount } from '@/lib/client/state';
import { api } from '@/constants';
import type { PackEntity } from '@lil-indigestion-cards/core/card';
import { createEffect, createResource } from 'solid-js';

export default function TotalPackCount(props: { count: number }) {
	const [packCountResource, { refetch }] = createResource(
		totalPackCount,
		async () => {
			const response = await fetch(api.PACK_COUNT);
			if (!response?.ok) return 0;
			const responseBody = await response.json();
			if (!responseBody.packCount || typeof responseBody.packCount !== 'number') return 0;
			return responseBody.packCount as number;
		},
		{ initialValue: props.count }
	);

	createEffect(() => setTotalPackCount(packCountResource()));

	return (
		<span class="no-text-shadow absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-black">
			{packCountResource()}
		</span>
	);
}
