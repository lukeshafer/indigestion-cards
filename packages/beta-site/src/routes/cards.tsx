import { loadAllCardDesigns } from '@site/data';
import { type RouteDefinition, type RouteSectionProps, createAsync } from '@solidjs/router';
import { For } from 'solid-js';
import Card from '@site/components/Card';

export const route = {
	load() {
		loadAllCardDesigns();
	},
} satisfies RouteDefinition;

export default function (props: RouteSectionProps) {
	const cards = createAsync(() => loadAllCardDesigns());

	return (
		<ul>
			<For each={cards()}>
				{card => (
					<li>
						<Card 
              {...card} 
              rarityId={card.bestRarityFound?.rarityName ?? ''}
              rarityColor={card.bestRarityFound?.rarityColor ?? ''}
              totalOfType={card.bestRarityFound?.count ?? 1}
              cardNumber={1}
            />
					</li>
				)}
			</For>
		</ul>
	);
}
