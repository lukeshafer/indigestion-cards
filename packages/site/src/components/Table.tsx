import { createMemo, type JSX, type Component, type ParentComponent } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { TextInput } from './form/Form';
import { createStore } from 'solid-js/store';

export const Table: ParentComponent<{ class?: string }> = props => {
	return (
		<div class="grid gap-0">
			<table
				class={twMerge(
					`w-full table-fixed border-separate border-spacing-y-3 text-center`,
					props.class ?? ''
				)}>
				{props.children}
			</table>
		</div>
	);
};

export const TBody: ParentComponent = props => (
	<tbody class="w-full justify-stretch justify-items-stretch gap-2">{props.children}</tbody>
);

export const THeading = <ColumnName extends string>(props: {
	label?: string;
	'no-sort'?: boolean;
	width?: string;
	showOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
	hideOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
	align?: 'left' | 'center' | 'right';
	class?: string;
	name: ColumnName;
	table: TableState<ColumnName>;
	children?: JSX.Element;
}) => {
	const sortMode = createMemo(() =>
		props.table.sortColumnName === props.name ? props.table.sortMode : null
	);

	return (
		<th
			data-mode={sortMode()}
			style={{ width: props.width }}
			classList={{
				'px-4 py-2 data-[mode=ascending]:after:content-["▲"] data-[mode=descending]:after:content-["▼"]':
					true, // required in classList due to being unable to escape quotes
				'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700': !props['no-sort'],
				hidden: props.showOnBreakpoint !== undefined,
				'sm:table-cell': props.showOnBreakpoint === 'sm',
				'md:table-cell': props.showOnBreakpoint === 'md',
				'lg:table-cell': props.showOnBreakpoint === 'lg',
				'xl:table-cell': props.showOnBreakpoint === 'xl',
				'sm:hidden': props.hideOnBreakpoint === 'sm',
				'md:hidden': props.hideOnBreakpoint === 'md',
				'lg:hidden': props.hideOnBreakpoint === 'lg',
				'xl:hidden': props.hideOnBreakpoint === 'xl',
				'text-left': props.align === 'left',
				'text-center': props.align === 'center',
				'text-right': props.align === 'right',
			}}
			onClick={() => {
				props.table.updateSortColumn(props.name);
			}}>
			{props.children || props.label}
		</th>
	);
};

export const THead: ParentComponent = props => (
	<thead>
		<tr>{props.children}</tr>
	</thead>
);

export const TRow: ParentComponent<{
	highlighted?: boolean;
}> = props => (
	<tr
		classList={{
			'group bg-brand-main/75 dark:bg-brand-dark font-semibold': props.highlighted,
			'group bg-amber-100 dark:bg-gray-800 font-medium': !props.highlighted,
		}}>
		{props.children}
	</tr>
);

export const TCell: ParentComponent<{
	showOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
	hideOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
	font?: 'default' | 'title';
	align?: 'left' | 'center' | 'right';
}> = props => (
	<td
		class="relative px-4 py-3 group-[compact]:p-2"
		classList={{
			hidden: !!props.showOnBreakpoint,
			'sm:table-cell': props.showOnBreakpoint === 'sm',
			'md:table-cell': props.showOnBreakpoint === 'md',
			'lg:table-cell': props.showOnBreakpoint === 'lg',
			'xl:table-cell': props.showOnBreakpoint === 'xl',
			'sm:hidden': props.hideOnBreakpoint === 'sm',
			'md:hidden': props.hideOnBreakpoint === 'md',
			'lg:hidden': props.hideOnBreakpoint === 'lg',
			'xl:hidden': props.hideOnBreakpoint === 'xl',
			'pb-2 font-display text-lg italic text-gray-700 dark:text-gray-50':
				props.font === 'title',
			'font-body text-base': props.font === 'default',
			'text-left': props.align === 'left',
			'text-center': props.align === 'center',
			'text-right': props.align === 'right',
		}}>
		{props.children}
	</td>
);

export const TSearch: Component<{
	label?: string;
	onInput?: (value: string) => void;
}> = props => (
	<TextInput
		inputOnly
		name="search"
		label={props.label || 'Search'}
		setValue={value => props.onInput?.(value)}
	/>
);

const SORT_MODES = ['none', 'ascending', 'descending'] as const;
type SortMode = (typeof SORT_MODES)[number];

type Row = Record<string, string | number>;

type ColumnType = 'text' | 'number' | 'date';
type ColumnConfig =
	| ColumnType
	| {
			type: ColumnType;
			startDescending?: boolean;
	  };
type Column = {
	name: string;
	/** @default 'text' */
	type?: ColumnType;
	startDescending?: boolean;
};

type TableState<ColumnName extends string> = {
	rows: Array<Record<ColumnName, string | number>>;
	setFilterString: (value: string) => void;
	filterString: string;
	sortMode: SortMode;
	sortColumnName: ColumnName | null;
	updateSortColumn: (column: ColumnName | null) => void;
	setFilteredColumn: (column: ColumnName | null) => void;
};

export function createTable<ColumnName extends string>(
	columns: () => Record<ColumnName, ColumnConfig>,
	rows: () => Array<Record<ColumnName, string | number>>
): TableState<ColumnName> {
	const [state, setState] = createStore({
		sortMode: 'none' as SortMode,
		sortedColumnName: null as ColumnName | null,
		filterString: '',
		filteredColumnName: null as ColumnName | null,
	});

	const sortedColumn = createMemo(() => resolveColumnFromName(state.sortedColumnName, columns()));
	const sortedRows = createMemo(() => sortRows(rows(), state.sortMode, sortedColumn()));
	const sortedAndFilteredRows = createMemo(() =>
		filterRows(sortedRows(), state.filterString, state.filteredColumnName)
	);

	return {
		get rows() {
			return sortedAndFilteredRows();
		},
		get sortMode() {
			return state.sortMode;
		},
		get filterString() {
			return state.filterString;
		},
		get sortColumnName() {
			return state.sortedColumnName;
		},
		updateSortColumn(column) {
			const newSortMode = getNewSortMode({
				prevColumn: sortedColumn(),
				sortMode: state.sortMode,
				newColumn: resolveColumnFromName(column, columns()),
			});

			setState({
				sortMode: newSortMode,
				sortedColumnName: column,
			});
		},
		setFilterString(value) {
			setState('filterString', value);
		},
		setFilteredColumn(column) {
			setState('filteredColumnName', column);
		},
	};
}

function resolveColumnFromName<ColumnName extends string>(
	name: ColumnName | null,
	columns: Record<ColumnName, ColumnConfig>
): Column | null {
	if (name === null) return null;

	const colConfig = columns[name];
	if (typeof colConfig === 'string') {
		return { name, type: colConfig };
	} else {
		return {
			name,
			type: colConfig.type,
			startDescending: colConfig.startDescending,
		};
	}
}

function sortRows<T extends Row>(rows: Array<T>, sortMode: SortMode, sortedColumn: Column | null) {
	return rows.slice().sort((a, b) => {
		if (sortMode === 'none' || !sortedColumn) return 0;
		let aVal = a[sortedColumn.name];
		let bVal = b[sortedColumn.name];
		if (!aVal && !bVal) return 0;
		if (!aVal) return sortMode === 'ascending' ? -1 : 1;
		if (!bVal) return sortMode === 'ascending' ? 1 : -1;
		if (aVal === bVal) return 0;
		if (typeof sortedColumn !== 'string' && sortedColumn.type === 'number') {
			return sortMode === 'ascending'
				? Number(aVal) - Number(bVal)
				: Number(bVal) - Number(aVal);
		}
		return sortMode === 'ascending'
			? String(aVal).localeCompare(String(bVal))
			: String(bVal).localeCompare(String(aVal));
	});
}

function filterRows<T extends Row>(
	rows: Array<T>,
	filterString: string,
	filteredColumnName: string | null
): Array<T> {
	if (!filterString || filteredColumnName == null) return rows;

	const lowercaseFilter = filterString.toLowerCase();

	return rows.filter(r => {
		const cell = r[filteredColumnName];
		if (!cell) return false;
		return String(cell).toLowerCase().includes(lowercaseFilter);
	});
}

function getNewSortMode(args: {
	prevColumn: Column | null;
	sortMode: SortMode;
	newColumn: Column | null;
}): SortMode {
	if (args.newColumn === null) {
		return 'none';
	}
	if (args.newColumn.name !== args.prevColumn?.name) {
		return args.newColumn?.startDescending ? 'descending' : 'ascending';
	} else {
		const currentModeIndex = SORT_MODES.indexOf(args.sortMode);
		const nextModeIndex =
			((args.newColumn.startDescending ? SORT_MODES.length - 1 : 1) + currentModeIndex) %
			SORT_MODES.length;
		return SORT_MODES.at(nextModeIndex)!;
	}
}

export const TableEls = {
	Table,
	THead,
	THeading,
	TBody,
	TRow,
	TCell,
	TSearch,
};
