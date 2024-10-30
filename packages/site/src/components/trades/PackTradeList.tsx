import { createMemo, createSignal, For, Show, type Component } from 'solid-js';
import { Select } from '../form/Form';
import { produce } from 'solid-js/store';
import { transformPackTypeName } from '@site/lib/client/utils';
import {
	TradeInventoryDetails,
	TradeInventoryItemCheckbox,
	TradeInventoryList,
	TradeInventoryStickyHeading,
} from './TradeInventoryList';
import type { TradePackUi } from './NewTrade';
import type { TradePack } from '@core/types';

export default function PackTradeList(props: {
	label: string;
	packs: TradePackUi[];
	setPacks: (setter: (cards: TradePack[]) => TradePack[]) => void;
	type: 'offer' | 'request';
}) {
	const [sort, setSort] = createSignal<SortType>('oldest');

	const sortedCards = createMemo(() => sortPacks(props.packs, sort()));

	return (
		<TradeInventoryDetails summary={props.label}>
			<TradeInventoryStickyHeading>
				<Select
					name="sort"
					label="Sort by"
					options={
						[
							{ value: 'oldest', label: 'Oldest' },
							{ value: 'newest', label: 'Newest' },
						] as const
					}
					setValue={val => setSort(val)}
				/>
			</TradeInventoryStickyHeading>
			<TradeInventoryList>
				<For each={sortedCards()}>
					{pack => (
						<TradeInventoryItemCheckbox
							checked={pack.checked || false}
							value={pack.packId}
							name={`${props.type}edPacks`}
							onSelect={() => props.setPacks(produce(draft => draft.push(pack)))}
							onDeselect={() =>
								props.setPacks(
									produce(draft => {
										let index = draft.findIndex(c => c.packId === pack.packId);
										while (index !== -1) {
											draft.splice(index, 1);
											index = draft.findIndex(c => c.packId === pack.packId);
										}
									})
								)
							}>
							<PackListItem pack={pack} />
						</TradeInventoryItemCheckbox>
					)}
				</For>
			</TradeInventoryList>
		</TradeInventoryDetails>
	);
}

export const PackListItem: Component<{
	pack: TradePack;
}> = props => (
	<div class="flex w-48 flex-col items-center text-center border-brand-main/50 bg-brand-main/25 border w-card card-aspect-ratio justify-center">
		<p class="whitespace-break-spaces font-bold text-xl">
			{transformPackTypeName(props.pack.packTypeName)} pack
		</p>
		<Show when={props.pack.createdAt}>
			{date => <p>Created {new Date(date()).toLocaleDateString()}</p>}
		</Show>
	</div>
);

type SortType = 'oldest' | 'newest';
function sortPacks(packs: Array<TradePackUi>, sortType: SortType): Array<TradePackUi> {
	switch (sortType) {
		case 'oldest':
			return packs.sort((packA, packB) => (packA.createdAt ?? 0) - (packB.createdAt ?? 0));
		case 'newest':
			return packs.sort((packA, packB) => (packB.createdAt ?? 0) - (packA.createdAt ?? 0));
	}
}
