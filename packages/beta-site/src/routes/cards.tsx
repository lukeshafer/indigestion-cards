import { Card, AnimatedCard, CardList } from '@site/components/Card';
import { loadAllCardDesigns } from '@site/data';
import { cache, createAsync, type RouteDefinition } from '@solidjs/router';
import { For } from 'solid-js';

export const route = {
	preload() {
		loadAllCardDesigns();
	},
} satisfies RouteDefinition;

export default function () {
	const cards = createAsync(() => loadAllCardDesigns());

	return (
		<CardList>
			<For each={cards() || []}>
				{card => (
					<li>
						<AnimatedCard>
							<Card
								cardNumber={1}
								totalOfType={card.bestRarityFound?.count ?? 1}
								rarityId={card.bestRarityFound?.rarityId ?? ''}
								rarityColor={card.bestRarityFound?.rarityColor ?? ''}
								{...card}
							/>
						</AnimatedCard>
					</li>
				)}
			</For>
		</CardList>
	);
}
