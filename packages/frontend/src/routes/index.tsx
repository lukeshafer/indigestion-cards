import { onMount } from 'solid-js';
import { A } from 'solid-start';
import Counter from '~/components/Counter';
import { usePageContext } from '~/lib/page-context';

export default function Home() {
	const { setBreadcrumbs } = usePageContext();
	onMount(() => {
		setBreadcrumbs([{ label: 'Home', current: true }]);
	});

	return (
		<main class="mx-auto p-4 text-center text-gray-700">
			<h1 class="max-6-xs my-16 text-6xl font-thin uppercase text-sky-700">Hello world!</h1>
			<Counter />
			<p class="mt-8">
				Visit{' '}
				<a href="https://solidjs.com" target="_blank" class="text-sky-600 hover:underline">
					solidjs.com
				</a>{' '}
				to learn how to build Solid apps.
			</p>
			<p class="my-4">
				<span>Home</span>
				{' - '}
				<A href="/about" class="text-sky-600 hover:underline">
					About Page
				</A>{' '}
			</p>
		</main>
	);
}
