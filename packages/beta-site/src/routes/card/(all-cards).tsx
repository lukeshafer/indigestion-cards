import { cache, createAsync, type RouteDefinition } from '@solidjs/router';
import { getAllCardDesignsWithBestRarity } from '@lib/design';
import CardList from '~/components/cards/CardList';
import { Show } from 'solid-js';

const getDesigns = cache(getAllCardDesignsWithBestRarity, 'designs');

export const route = {
	load: () => getDesigns(),
} satisfies RouteDefinition;

export default function Cards() {
	const designs = createAsync(getDesigns);

	return (
		<>
			<header class="max-w-main mx-auto mb-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
				<h1 class="font-heading my-2 text-3xl font-bold uppercase text-gray-600 dark:text-gray-300">
					All Cards
				</h1>
			</header>
			<Show when={designs()}>
				{(designs) => (
					<CardList
						cards={designs()}
						sortOnlyBy={['card-name-asc', 'card-name-desc']}></CardList>
				)}
			</Show>
		</>
	);
}
