import type { SiteConfig } from '@core/types';
import { For, createSignal, createUniqueId } from 'solid-js';
import { FULL_ART_ID, LEGACY_CARD_ID } from '@admin/constants';
import { createStore, produce } from 'solid-js/store';
import { useViewTransition } from '@admin/lib/client/utils';
import { Heading } from '../text';

type RarityRankingType = NonNullable<SiteConfig['rarityRanking']>[number];
export type RarityRankingRecord = Record<string, RarityRankingType | undefined>;

type Rarity = { rarityId: string; rarityName: string; defaultCount: number };

export default function RarityRanking(props: {
	rarities: Rarity[];
	initialRanking: RarityRankingRecord;
	setIsEdited: () => void;
}) {
	const extraRarities = [
		{
			rarityId: FULL_ART_ID,
			rarityName: 'Full Art',
			defaultCount: 1,
		},
		{
			rarityId: LEGACY_CARD_ID,
			rarityName: 'Legacy',
			defaultCount: 1,
		},
	] satisfies Rarity[];

	const [state, setState] = createStore({
		// eslint-disable-next-line solid/reactivity
		ranking: [...props.rarities, ...extraRarities].sort((a, b) => {
			const aRanking = props.initialRanking[a.rarityId]?.ranking ?? Infinity;
			const bRanking = props.initialRanking[b.rarityId]?.ranking ?? Infinity;

			return aRanking - bRanking || a.defaultCount - b.defaultCount;
		}),
	});

	const moveToIndex = (fromIndex: number, toIndex: number) => {
		if (fromIndex === toIndex) return;
		if (toIndex < 0 || toIndex >= state.ranking.length) return;

		useViewTransition(() => {
			props.setIsEdited();
			setState(
				'ranking',
				produce((draft) => {
					const item = draft.splice(fromIndex, 1)[0];
					draft.splice(toIndex, 0, item);
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
						<RankingItem
							rarity={rarity}
							index={index()}
							moveToIndex={moveToIndex}
							listLength={state.ranking.length}
						/>
					)}
				</For>
			</ul>
		</section>
	);
}

function RankingItem(props: {
	rarity: Rarity;
	index: number;
	moveToIndex(fromIndex: number, toIndex: number): void;
	listLength: number;
}) {
	const [isDragging, setIsDragging] = createSignal(false);
	const [isDragOver, setIsDragOver] = createSignal(false);

	return (
		<li
			draggable="true"
			id={createUniqueId()}
			onDragStart={(e) => {
				const index = props.index;
				setIsDragging(true);
				if (!e.dataTransfer) return;
				e.dataTransfer.setData('text', String(index));
				e.dataTransfer.effectAllowed = 'move';
			}}
			onDragEnd={() => setIsDragging(false)}
			onDragEnter={(e) => {
				e.preventDefault();
				setIsDragOver(true);
			}}
			onDragOver={(e) => e.preventDefault()}
			onDragLeave={() => setIsDragOver(false)}
			onDrop={(e) => {
				e.preventDefault();
				setIsDragOver(false);
				const fromIndexString = e.dataTransfer?.getData('text');
				const fromIndex = fromIndexString ? parseInt(fromIndexString) : null;
				if (fromIndex === null) return;
				props.moveToIndex(fromIndex, props.index);
			}}
			class="even:bg-brand-100 dark:even:bg-brand-dark/50 group flex 
						items-center odd:bg-gray-300 dark:odd:bg-gray-800"
			classList={{
				'opacity-50': isDragOver() || isDragging(),
			}}
			style={{ 'view-transition-name': props.rarity.rarityId }}>
			<span class="flex flex-col px-1">
				<button
					name="up"
					classList={{ 'opacity-20': props.index === 0 }}
					onClick={(e) => {
						e.preventDefault();
						props.moveToIndex(props.index, props.index - 1);
					}}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24">
						<path
							fill="currentColor"
							d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"
						/>
					</svg>
				</button>
				<button
					name="down"
					classList={{
						'opacity-20': props.index === props.listLength - 1,
					}}
					onClick={(e) => {
						e.preventDefault();
						props.moveToIndex(props.index, props.index + 1);
					}}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24">
						<path
							fill="currentColor"
							d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z"
						/>
					</svg>
				</button>
			</span>
			<span class="inline-block w-8 p-2 text-center">{props.index + 1}</span>
			<span>{props.rarity.rarityName} ({props.rarity.rarityId})</span>
		</li>
	);
}
