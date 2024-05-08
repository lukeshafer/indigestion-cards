import {
	useViewTransition,
	type SortType,
	sortTypes as validSortTypes,
} from '@site/lib/client/utils';
import { Select } from '../form/Form';

export default function CardListSortDropdown(props: {
	sortTypes: Array<SortType> | 'all';
	setSort: (value: SortType) => void;
}) {
	const selectedSortTypes = () =>
		props.sortTypes === 'all'
			? validSortTypes.slice()
			: validSortTypes.filter(type => props.sortTypes.includes(type.value));

	return (
		<Select
			name="sort"
			class="h-8 self-end p-1"
			label="Sort by"
			setValue={val => useViewTransition(() => props.setSort(val as SortType))}
			options={selectedSortTypes()}
		/>
	);
}
