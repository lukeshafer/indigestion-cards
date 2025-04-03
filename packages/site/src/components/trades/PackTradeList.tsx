import { createMemo, createSignal, For } from 'solid-js';
import { Select } from '../Form';
import { produce } from 'solid-js/store';
import { transformPackTypeName } from '@site/client/utils';
import * as TradeInventory from './TradeInventoryList';
import type { TradePackUi } from './NewTrade';
import type { TradePack } from '@core/types';
import { formatPackNumber, Pack } from '@site/components/Pack';

export default function PackTradeList(props: {
	label: string;
	packs: TradePackUi[];
	setPacks: (setter: (cards: TradePack[]) => TradePack[]) => void;
	type: 'offer' | 'request';
}) {
	const [sort, setSort] = createSignal<SortType>('oldest');

	const sortedPacks = createMemo(() => sortPacks(props.packs, sort()));

	return (
		<TradeInventory.TradeInventoryDetails summary={props.label}>
			<TradeInventory.TradeInventoryStickyHeading>
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
			</TradeInventory.TradeInventoryStickyHeading>
			<TradeInventory.TradeInventoryList>
				<For each={sortedPacks()}>
					{pack => (
						<TradeInventory.TradeInventoryItemCheckbox
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
							<Pack
								name={transformPackTypeName(pack.packTypeName)}
								scale={0.5}
								packNumber={formatPackNumber(pack)}
							/>
						</TradeInventory.TradeInventoryItemCheckbox>
					)}
				</For>
			</TradeInventory.TradeInventoryList>
		</TradeInventory.TradeInventoryDetails>
	);
}

type SortType = 'oldest' | 'newest';
function sortPacks(packs: Array<TradePackUi>, sortType: SortType): Array<TradePackUi> {
	switch (sortType) {
		case 'oldest':
			return packs.sort((packA, packB) => (packA.createdAt ?? 0) - (packB.createdAt ?? 0));
		case 'newest':
			return packs.sort((packA, packB) => (packB.createdAt ?? 0) - (packA.createdAt ?? 0));
	}
}
