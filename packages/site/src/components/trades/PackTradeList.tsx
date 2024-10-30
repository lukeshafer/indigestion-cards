import { createMemo, createSignal, For, type Component } from 'solid-js';
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
							<PackListItem name={transformPackTypeName(pack.packTypeName)} small />
						</TradeInventoryItemCheckbox>
					)}
				</For>
			</TradeInventoryList>
		</TradeInventoryDetails>
	);
}

export const PackListItem: Component<{
	name: string;
	small?: boolean;
}> = props => (
	<div
		class="border-brand-main/50 bg-brand-main/25 card-aspect-ratio relative flex flex-col justify-center border px-[2.5em] py-[1.5em] text-center"
		style={{
			width: '18em',
			'font-size': props.small ? '0.5rem' : 'default',
		}}>
		<p class="font-display absolute bottom-0 right-0 whitespace-break-spaces p-[0.5em] font-bold lowercase italic leading-[0.7em]">
			Indigestion
		</p>
		<p class="self-center whitespace-break-spaces text-center">
      <span class="text-[2em] font-bold">{props.name}</span>
      {
        <span class="block leading-[0.5em]">pack</span>
      }
		</p>
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
