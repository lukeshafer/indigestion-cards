import { type ParentProps, createSignal, For, createEffect, JSX } from 'solid-js';
import { createStore } from 'solid-js/store';
import { TextInput } from '../form/Form';

const sortModes = ['none', 'ascending', 'descending'] as const;

interface Column {
	name: string;
	label?: string;
	sort?: boolean;
	width?: string;
	type?: 'text' | 'number' | 'date';
	showOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
	startDescending?: boolean;
	align?: 'left' | 'center' | 'right';
	font?: 'default' | 'title';
}

type Cell =
	| string
	| number
	| {
			element: JSX.Element;
			value: string | number;
	  };

export default function Table(props: {
	id?: string;
	columns: Column[];
	rows: Record<string, Cell>[];
	compact?: boolean;
	search?: {
		label?: string;
		column: string;
	};
}) {
	const [state, setState] = createStore<{
		sortedColumn: string | null;
		sortMode: (typeof sortModes)[number];
		filter: string;
	}>({
		sortedColumn: null,
		sortMode: 'none',
		filter: '',
	});

	const sortedRows = () => {
		const heading = state.sortedColumn;
		if (heading === null) return props.rows;

		const mode = state.sortMode;
		if (mode === 'none') return props.rows;

		const column = props.columns.find((c) => c.name === heading);
		if (!column) return props.rows;

		const type = column.type ?? 'text';

		return props.rows.slice().sort((a, b) => {
			const aVal = getCellValue(a[heading]);
			const bVal = getCellValue(b[heading]);

			if (!aVal && !bVal) return 0;
			if (!aVal) return mode === 'ascending' ? -1 : 1;
			if (!bVal) return mode === 'ascending' ? 1 : -1;
			if (aVal === bVal) return 0;
			if (type === 'number')
				return mode === 'ascending'
					? Number(aVal) - Number(bVal)
					: Number(bVal) - Number(aVal);
			if (aVal < bVal) return mode === 'ascending' ? -1 : 1;
			if (aVal > bVal) return mode === 'ascending' ? 1 : -1;
			return 0;
		});
	};

	const filteredRows = () => {
		const filter = state.filter.toLowerCase();
		if (!filter) return sortedRows();

		const rows = sortedRows()
			.slice()
			.filter((row) => {
				const cell = row[props.search?.column ?? ''];
				const cellValue = getCellValue(cell);
				if (!cellValue) return false;
				return String(cellValue).toLowerCase().includes(filter);
			})
			.sort((a, b) => {
				const aVal = getCellValue(a[props.search?.column ?? '']);
				const bVal = getCellValue(b[props.search?.column ?? '']);

				if (!aVal && !bVal) return 0;
				if (!aVal) return -1;
				if (!bVal) return 1;

				const aText = String(aVal);
				const bText = String(bVal);
				return aText.toLowerCase().indexOf(filter) - bText.toLowerCase().indexOf(filter);
			});

		return rows;
	};

	return (
		<div>
			{props.search ? (
				<div class="mb-4 ml-auto w-fit">
					<SearchBar
						label={props.search.label}
						setFilter={(filter) => setState('filter', filter)}
					/>
				</div>
			) : null}
			<table
				class="w-full table-fixed text-center"
				classList={{ groupcompact: props.compact }}
				id={props.id}>
				<thead>
					<tr>
						<For each={props.columns}>
							{(column) => (
								<TableHeading
									{...column}
									mode={
										state.sortedColumn === column.name ? state.sortMode : 'none'
									}
									onClick={() => {
										if (state.sortedColumn !== column.name) {
											setState('sortedColumn', column.name);
											setState(
												'sortMode',
												column.startDescending ? 'descending' : 'ascending'
											);
											return;
										}

										const currentModeIndex = sortModes.indexOf(state.sortMode);
										const newMode = sortModes.at(
											((column.startDescending ? sortModes.length - 1 : 1) +
												currentModeIndex) %
												sortModes.length
										) as (typeof sortModes)[number];
										setState('sortMode', newMode);
									}}
								/>
							)}
						</For>
					</tr>
				</thead>
				<tbody>
					<For each={props.search ? filteredRows() : sortedRows()}>
						{(row) => (
							<tr class="even:bg-brand-100 group odd:bg-gray-300">
								<For each={props.columns}>
									{(column) => (
										<TableCell
											showOnBreakpoint={column.showOnBreakpoint}
											font={column.font}
											align={column.align}>
											{row[column.name] ?? '-'}
										</TableCell>
									)}
								</For>
							</tr>
						)}
					</For>
				</tbody>
			</table>
		</div>
	);
}

function SearchBar(props: { label?: string; setFilter: (filter: string) => void }) {
	return (
		<TextInput
			inputOnly
			name="search"
			label={props.label ?? 'Search'}
			setValue={props.setFilter}
		/>
	);
}

function TableHeading(
	props: Column & {
		onClick?: () => void;
		mode?: (typeof sortModes)[number];
	}
) {
	return (
		<th
			data-mode={props.mode}
			onClick={props.sort === false ? undefined : props.onClick}
			style={{ width: props.width }}
			classList={{
				'cursor-pointer': props.sort ?? true,
				hidden: props.showOnBreakpoint !== undefined,
				'sm:table-cell': props.showOnBreakpoint === 'sm',
				'md:table-cell': props.showOnBreakpoint === 'md',
				'lg:table-cell': props.showOnBreakpoint === 'lg',
				'xl:table-cell': props.showOnBreakpoint === 'xl',
				'text-left': props.align === 'left',
				'text-center': props.align === 'center',
				'text-right': props.align === 'right',
				'px-6 py-2 data-[mode=ascending]:after:content-["▲"] data-[mode=descending]:after:content-["▼"]':
					true,
			}}>
			{props.label}
		</th>
	);
}

function TableCell(props: {
	children: Cell;
	showOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
	font?: 'default' | 'title';
	align?: 'left' | 'center' | 'right';
}) {
	return (
		<td
			class="relative p-6 font-medium group-[compact]:p-2"
			classList={{
				hidden: !!props.showOnBreakpoint,
				'sm:table-cell': props.showOnBreakpoint === 'sm',
				'md:table-cell': props.showOnBreakpoint === 'md',
				'lg:table-cell': props.showOnBreakpoint === 'lg',
				'xl:table-cell': props.showOnBreakpoint === 'xl',
				'font-display': props.font === 'title',
				'text-xl': props.font === 'title',
				italic: props.font === 'title',
				'text-gray-700': props.font === 'title',
				'font-body': props.font === 'default',
				'text-base': props.font === 'default',
				'text-left': props.align === 'left',
				'text-center': props.align === 'center',
				'text-right': props.align === 'right',
			}}>
			{getCellElement(props.children)}
		</td>
	);
}

const getCellElement = (row: Cell | undefined) =>
	(typeof row === 'object' && 'element' in row ? row.element : row) as JSX.Element;

const getCellValue = (row: Cell | undefined) =>
	typeof row === 'object' && 'value' in row ? row.value : row;
