import Card from '@site/components/Card';
import { loadAllCardDesigns } from '@site/data';
import { createAsync, type RouteDefinition } from '@solidjs/router';
import { For } from 'solid-js';

export const route = {
	load() {
		loadAllCardDesigns();
	},
} satisfies RouteDefinition;

export default function () {
	const cards = createAsync(() => loadAllCardDesigns());

	return (
		<ul>
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
