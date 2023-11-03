import type { SiteConfig } from '@lil-indigestion-cards/core/db/siteConfig';
import { For } from 'solid-js';
import { FULL_ART_ID, LEGACY_CARD_ID } from '@/constants';
import { createStore, produce } from 'solid-js/store';
import { useViewTransition } from '@/lib/client/utils';
import { Heading } from '../text';

type RarityRankingType = NonNullable<SiteConfig['rarityRanking']>[number];
export type RarityRankingRecord = Record<string, RarityRankingType | undefined>;

type Rarity = { rarityId: string; rarityName: string };

export default function RarityRanking(props: {
	rarities: Rarity[];
	initialRanking: RarityRankingRecord;
	setIsEdited: () => void;
}) {
	const extraRarities = [
		{
			rarityId: FULL_ART_ID,
			rarityName: 'Full Art',
		},
		{
			rarityId: LEGACY_CARD_ID,
			rarityName: 'Legacy',
		},
	] satisfies Rarity[];

	const [state, setState] = createStore({
		// eslint-disable-next-line solid/reactivity
		ranking: [...props.rarities, ...extraRarities].sort((a, b) => {
			const aRanking = props.initialRanking[a.rarityId]?.ranking ?? Infinity;
			const bRanking = props.initialRanking[b.rarityId]?.ranking ?? Infinity;

			return aRanking - bRanking;
		}),
	});

	const moveUp = (index: number) => {
		if (index <= 0) return;
		props.setIsEdited();

		useViewTransition(() => {
			setState(
				'ranking',
				produce((draft) => {
					const moving = draft.splice(index, 1)[0];
					draft.splice(index - 1, 0, moving);
				})
			);
		});
	};

	const moveDown = (index: number) => {
		if (index >= state.ranking.length) return;
		props.setIsEdited();

		useViewTransition(() => {
			setState(
				'ranking',
				produce((draft) => {
					const moving = draft.splice(index, 1)[0];
					draft.splice(index + 1, 0, moving);
				})
			);
		});
	};

	return (
		<section class="w-full">
			<Heading>Rarity Ranking</Heading>
			<input type="hidden" name="rarityRanking" value={JSON.stringify(state.ranking)} />
			<ul class="w-full">
				<For each={state.ranking}>
					{(rarity, index) => (
						<li
							class="even:bg-brand-100 dark:even:bg-brand-dark/50 group flex 
						items-center odd:bg-gray-300 dark:odd:bg-gray-800"
							style={{
								'view-transition-name': rarity.rarityId,
							}}>
							<span class="flex flex-col px-1">
								<button
									name="up"
									classList={{ 'opacity-20': index() === 0 }}
									onClick={(e) => {
										e.preventDefault();
										moveUp(index());
									}}>
									<Arrow up />
								</button>
								<button
									name="down"
									classList={{
										'opacity-20': index() === state.ranking.length - 1,
									}}
									onClick={(e) => {
										e.preventDefault();
										moveDown(index());
									}}>
									<Arrow down />
								</button>
							</span>
							<span class="inline-block w-8 p-2 text-center">{index() + 1}</span>
							<span>{rarity.rarityName}</span>
						</li>
					)}
				</For>
			</ul>
		</section>
	);
}

function Arrow(props: { up?: boolean; down?: boolean }) {
	const path = () =>
		props.up
			? 'M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z'
			: props.down
			? 'M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z'
			: '';

	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
			<path fill="currentColor" d={path()} />
		</svg>
	);
}
