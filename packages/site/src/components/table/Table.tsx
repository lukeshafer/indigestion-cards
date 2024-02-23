import type { JSX, ParentProps } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { createContext, createEffect, createMemo, splitProps, useContext } from 'solid-js';
import { ReactiveMap } from '@solid-primitives/map';

import { createSignal } from 'solid-js';
import { TextInput } from '../form/Form';

const SORT_MODES = ['none', 'ascending', 'descending'] as const;
type SortMode = (typeof SORT_MODES)[number];
type TableContext = {
	rows: ReactiveMap<HTMLTableRowElement, Row>;
	clickedColumn: (column: ColumnType | null) => void;
	setTableBody: (value: HTMLTableSectionElement) => void;
};
const TableContext = createContext<TableContext>();

const RowContext = createContext<Omit<Row, 'element'>>();
type Row = { cells: ReactiveMap<string, Cell>; element: HTMLTableRowElement };
type Cell = { column: string; value: string | number; element: HTMLTableCellElement };

export default {
  Table,
  Head: TableHead,
  Column: TableColumn,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
  Search,
}

function Table(
	props: JSX.HTMLAttributes<HTMLTableElement> &
		ParentProps<{
			searchColumn?: string;
			searchText?: string;
		}>
) {
	const [local, rest] = splitProps(props, ['class', 'searchColumn', 'searchText', 'children']);

	const [sortedColumn, setSortedColumn] = createSignal<ColumnType | null>(null);
	const [sortMode, setSortMode] = createSignal<SortMode>('none');
	const [tableBody, setTableBody] = createSignal<HTMLTableSectionElement>();
	const rows = new ReactiveMap<HTMLTableRowElement, Row>();

	const context: TableContext = {
		rows,
		setTableBody,
		clickedColumn: column => {
			if (!column) return setSortedColumn(column);
			if (column.name !== sortedColumn()?.name) {
				setSortedColumn(column);
				setSortMode(column.startDescending ? 'descending' : 'ascending');
			} else {
				const currentModeIndex = SORT_MODES.indexOf(sortMode());
				setSortMode(
					SORT_MODES.at(
						((column.startDescending ? SORT_MODES.length - 1 : 1) + currentModeIndex) %
							SORT_MODES.length
					) as SortMode
				);
			}

      column.element.dataset.mode = sortMode()
		},
	};


	const sortedRows = createMemo(() =>
		[...context.rows.values()].sort((a, b) => {
			const sortedColumnValue = sortedColumn();
			const sortModeValue = sortMode();
			if (sortModeValue === 'none' || sortedColumnValue === null) return 0;

			const aVal = a.cells.get(sortedColumnValue.name)?.value ?? '';
			const bVal = b.cells.get(sortedColumnValue.name)?.value ?? '';

			if (!aVal && !bVal) return 0;
			if (!aVal) return sortModeValue === 'ascending' ? -1 : 1;
			if (!bVal) return sortModeValue === 'ascending' ? 1 : -1;

			if (aVal === bVal) return 0;
			if (sortedColumnValue.type === 'number')
				return sortModeValue === 'ascending'
					? Number(aVal) - Number(bVal)
					: Number(bVal) - Number(aVal);

			return sortModeValue === 'ascending'
				? String(aVal).localeCompare(String(bVal))
				: String(bVal).localeCompare(String(aVal));
		})
	);

	const sortedAndFilteredRows = (): Row[] => {
		const searchText = local.searchText?.toLowerCase();
		const searchColumn = local.searchColumn;
		if (!searchText || !searchColumn) return sortedRows();
		else
			return sortedRows().filter(row => {
				const cell = row.cells.get(searchColumn);
				if (!cell?.value) return false;
				else return String(cell.value).toLowerCase().includes(searchText);
			});
	};

	createEffect(() => {
		const els = sortedAndFilteredRows().map(({ element }) => element);
		tableBody()?.replaceChildren(...els);
	});

	return (
		<TableContext.Provider value={context}>
			<div class="grid gap-0">
				<table
					class={twMerge(
						`w-full table-fixed border-separate border-spacing-y-3 text-center`,
						local.class
					)}
					{...rest}>
					{local.children}
				</table>
			</div>
		</TableContext.Provider>
	);
}

type ColumnType = {
	element: HTMLTableCellElement;
	startDescending: boolean;
	name: string;
	label: string;
	type: 'text' | 'number' | 'date';
	sort: boolean;
};

function TableBody(props: ParentProps) {
	const ctx = useContext(TableContext);
	return (
		<tbody
			ref={el => ctx?.setTableBody(el)}
			class="w-full justify-stretch justify-items-stretch gap-2">
			{props.children}
		</tbody>
	);
}

function TableColumn(
	props: ParentProps<{
		name: string;
		label?: string;
		'no-sort'?: boolean;
		width?: string;
		type?: 'text' | 'number' | 'date';
		showOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
		hideOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
		startDescending?: boolean;
		align?: 'left' | 'center' | 'right';
		class?: string;
	}>
) {
	const ctx = useContext(TableContext);

	return (
		<th
			style={{ width: props.width }}
			onClick={e => {
				ctx?.clickedColumn({
          element: e.currentTarget,
          name: props.name,
          label: props.label ?? "",
          startDescending: props.startDescending || false,
          type: props.type || 'text',
          sort: !props['no-sort']
				});
			}}
			classList={{
				[twMerge('px-2 py-2', props.class)]: true,
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
				'data-[mode=ascending]:after:content-["▲"] data-[mode=descending]:after:content-["▼"]':
					true,
			}}>
			{props.children || props.label}
		</th>
	);
}

function TableHead(props: ParentProps) {
	return (
		<thead>
			<tr>{props.children}</tr>
		</thead>
	);
}

function TableRow(
	props: ParentProps<{ highlighted?: boolean }> & JSX.HTMLAttributes<HTMLTableRowElement>
) {
	const [local, rest] = splitProps(props, ['class', 'highlighted']);
	const ctx = useContext(TableContext);

	const baseClass =
		/*tw*/
		local.highlighted
			? 'group bg-brand-main/75 dark:bg-brand-dark font-semibold'
			: 'group bg-amber-100 dark:bg-gray-800 font-medium';

	const cells = new ReactiveMap<string, Cell>();

	return (
		<tr
			ref={el => {
				ctx?.rows.set(el, { cells, element: el });
			}}
			class={local.class ? twMerge(baseClass, local.class) : baseClass}
			{...rest}>
			<RowContext.Provider value={{ cells }}>{props.children}</RowContext.Provider>
		</tr>
	);
}

function TableCell(
	props: ParentProps<{
		column: string;
		value: string | number;
		showOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
		hideOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
		font?: 'default' | 'title';
		align?: 'left' | 'center' | 'right';
	}>
) {
	const ctx = useContext(RowContext);

	return (
		<td
			ref={el =>
				ctx?.cells.set(props.column, {
					column: props.column,
					value: props.value,
					element: el,
				})
			}
			class="relative px-2 py-3 group-[compact]:p-2"
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
				'font-display': props.font === 'title',
				'text-lg': props.font === 'title',
				'pb-2': props.font === 'title',
				italic: props.font === 'title',
				'text-gray-700 dark:text-gray-50': props.font === 'title',
				'font-body': props.font === 'default',
				'text-base': props.font === 'default',
				'text-left': props.align === 'left',
				'text-center': props.align === 'center',
				'text-right': props.align === 'right',
			}}>
			{props.children || props.value}
		</td>
	);
}

function Search(props: { label?: string; setSearchText(value: string): void }) {
	return (
		<div class="ml-auto block w-fit text-sm">
			<TextInput
				inputOnly
				name="search"
				label={props.label || 'Search'}
				setValue={value => {
					props.setSearchText?.(value);
				}}
			/>
		</div>
	);
}
