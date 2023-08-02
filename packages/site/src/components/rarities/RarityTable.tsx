import Table from '@/components/table/Table';
import type { RarityEntity } from '@lil-indigestion-cards/core/card';
import DeleteRarityButton from './DeleteRarityButton';

export default function RarityTable(props: { rarities: RarityEntity[] }) {
	return (
		<Table
			columns={[
				{
					name: 'name',
					label: 'Name',
					font: 'title',
					width: '40%',
				},
				{
					name: 'count',
					label: 'Default Count',
					showOnBreakpoint: 'sm',
					type: 'number',
				},
				{
					name: 'actions',
					label: 'Actions',
					sort: false,
				},
			]}
			rows={props.rarities.map((rarity) => ({
				name: rarity.rarityName,
				count: rarity.defaultCount,
				actions: { element: <DeleteRarityButton {...rarity} />, value: '' },
			}))}
		/>
	);
}
