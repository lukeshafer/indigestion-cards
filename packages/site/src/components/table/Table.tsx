import { type ParentProps, createSignal, For, createEffect, JSX } from 'solid-js';
import { createStore } from 'solid-js/store';

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

export default function Table(props: {
	id?: string;
	columns: Column[];
	rows: Record<string, JSX.Element>[];
	compact?: boolean;
}) {
	const [state, setState] = createStore<{
		sortedColumn: string | null;
		sortMode: (typeof sortModes)[number];
	}>({
		sortedColumn: null,
		sortMode: 'none',
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
			const aVal = a[heading];
			const bVal = b[heading];

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

	return (
		<table class="w-full table-fixed text-center" id={props.id}>
			<thead>
				<tr>
					<For each={props.columns}>
						{(column) => (
							<TableHeading
								{...column}
								mode={state.sortedColumn === column.name ? state.sortMode : 'none'}
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
				<For each={sortedRows()}>
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

function TableCell(
	props: ParentProps<{
		showOnBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
		font?: 'default' | 'title';
		align?: 'left' | 'center' | 'right';
	}>
) {
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
			{props.children}
		</td>
	);
}
