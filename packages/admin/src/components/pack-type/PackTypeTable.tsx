import Table from '@admin/components/table/Table';
import { routes } from '@admin/constants';
import type { PackType } from '@core/types';
import CardsIcon from '../icons/CardsIcon';

export default function PackTypeTable(props: { packTypes: PackType[] }) {
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
							<div
								aria-hidden="true"
								class="absolute left-1/2 top-1/2 w-12 -translate-x-1/2 -translate-y-1/2 fill-white stroke-white dark:fill-gray-900 dark:stroke-gray-900">
								<CardsIcon size={50} />
							</div>
							<span class="relative rounded-full bg-white p-1 dark:bg-gray-900">
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
