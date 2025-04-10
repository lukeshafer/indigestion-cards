import type { ParentProps } from 'solid-js';

export default function ButtonCount(props: ParentProps) {
	return (
		<div class="text-brand-main absolute right-0 top-0 flex h-5 w-5 min-w-fit -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white px-1 text-xs font-semibold outline outline-1 dark:bg-gray-950 dark:font-bold z-10">
			{props.children}
		</div>
	);
}
