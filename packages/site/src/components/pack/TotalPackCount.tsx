import { totalPackCount } from '@/lib/client/state';
import type { PackEntity } from '@lil-indigestion-cards/core/card';

export default function TotalPackCount(props: { count: number }) {
	return (
		<span class="no-text-shadow absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-black">
			{totalPackCount() ?? props.count}
		</span>
	);
}
