import Table from '@/components/table/Table';
import { routes } from '@/constants';
import type { PackTypeEntity } from '@lil-indigestion-cards/core/card';
import { TbCards } from 'solid-icons/tb';

export default function PackTypeTable(props: { packTypes: PackTypeEntity[] }) {
	return (
		<Table
			columns={[
				{
					name: 'packTypeName',
					label: 'Pack Name',
					font: 'title',
					width: '50%',
				},
				{
					name: 'cardPool',
					label: 'Card Pool',
				},
				{
					name: 'cards',
					label: 'Cards',
					type: 'number',
				},
			]}
			rows={props.packTypes.map((packType) => ({
				packTypeName: {
					element: (
						<a
							href={`${routes.PACK_TYPES}/${packType.packTypeId}`}
							class="hover:underline focus:underline">
							{packType.packTypeName}
						</a>
					),
					value: packType.packTypeName,
				},
				cardPool:
					packType.packTypeCategory === 'season'
						? packType.seasonName ?? ''
						: packType.packTypeCategory,
				cards: {
					element: (
						<>
							<TbCards
								aria-hidden="true"
								fill="white"
								stroke="white"
								size={50}
								class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
							/>
							<span class="relative rounded-full bg-white p-1">
								{packType.cardCount}
							</span>
						</>
					),
					value: packType.cardCount,
				},
			}))}
		/>
	);
}
