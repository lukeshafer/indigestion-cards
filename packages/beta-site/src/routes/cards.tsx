import { Card, AnimatedCard, CardList } from '@site/components/Card';
import { cache, createAsync, type RouteDefinition } from '@solidjs/router';
import { For } from 'solid-js';

const fetchDesigns = cache(async () => {
	'use server';
	const { getAllCardDesigns } = await import('@core/lib/design');
	return getAllCardDesigns();
}, 'carddesigns');

export const route = {
	async preload() {
		return fetchDesigns();
	},
} satisfies RouteDefinition;

export default function () {
	const cards = createAsync(() => fetchDesigns());

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
