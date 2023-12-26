import { cache, createAsync, type RouteDefinition } from '@solidjs/router';
import { getAllCardDesignsWithBestRarity } from '@lib/design';
import CardList from '~/components/cards/CardList';
import { Show } from 'solid-js';
import { PageHeader, PageTitle } from '~/components/text';

const getDesigns = cache(getAllCardDesignsWithBestRarity, 'designs');

export const route = {
	load: () => getDesigns(),
} satisfies RouteDefinition;

export default function Cards() {
	const designs = createAsync(getDesigns);

	return (
		<>
			<PageHeader>
				<PageTitle>All Cards</PageTitle>
			</PageHeader>
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
