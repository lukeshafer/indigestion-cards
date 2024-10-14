import Card from '@site/components/Card';
import { loadAllCardDesigns } from '@site/data';
import { cache, createAsync, type RouteDefinition } from '@solidjs/router';
import { For } from 'solid-js';

export const route = {
	load() {
		loadAllCardDesigns();
	},
} satisfies RouteDefinition;

export default function () {
	const cards = createAsync(() => loadAllCardDesigns());

	return (
		<ul class="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] justify-center justify-items-center gap-x-10 gap-y-8">
			<For each={cards() || []}>
				{card => (
					<li>
						<Card
							cardNumber={1}
							totalOfType={card.bestRarityFound?.count ?? 1}
							rarityId={card.bestRarityFound?.rarityId ?? ''}
							rarityColor={card.bestRarityFound?.rarityColor ?? ''}
							{...card}
						/>
					</li>
				)}
			</For>
		</ul>
	);
}
