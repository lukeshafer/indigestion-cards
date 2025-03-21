import type { ParentComponent } from 'solid-js';

export const TradeInventoryDetails: ParentComponent<{ summary: string }> = props => {
	return (
		<details class="bg-brand-100 dark:bg-brand-950 scrollbar-narrow scrollbar-brand m-4 max-h-screen overflow-y-scroll cursor-pointer">
			<summary class="bg-brand-100 dark:bg-brand-950 sticky top-0 z-10 h-14 p-4 text-lg">
				{props.summary}
			</summary>
			{props.children}
		</details>
	);
};

export const TradeInventoryStickyHeading: ParentComponent = props => (
	<div class="bg-brand-100 dark:bg-brand-950 border-b-brand-main sticky top-14 z-10 border-b p-4 pt-0">
		{props.children}
	</div>
);

export const TradeInventoryList: ParentComponent = props => (
	<ul class="flex flex-wrap justify-center gap-4 py-4">{props.children}</ul>
);

export const TradeInventoryItemCheckbox: ParentComponent<{
	name: string;
	value: string;
	checked: boolean;
	onSelect: () => void;
	onDeselect: () => void;
}> = props => (
	<li
		class="m-1 p-2"
		classList={{
			'outline outline-4 outline-brand-main bg-gray-200 dark:bg-gray-800 opacity-90':
				props.checked,
		}}>
		<label class="relative cursor-pointer text-center">
			<input
				class="absolute opacity-0 checked:left-4 checked:top-4 checked:z-50 checked:opacity-100"
				name={props.name}
				value={props.value}
				checked={props.checked}
				type="checkbox"
				onInput={e => {
					if (e.currentTarget.checked) {
						props.onSelect();
					} else {
						props.onDeselect();
					}
				}}
			/>
      {props.children}
		</label>
	</li>
);
