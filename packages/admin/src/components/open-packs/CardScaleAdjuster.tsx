import { createEffect, useContext } from 'solid-js';
import { OpenPacksContext } from './OpenPacksContext';

export function CardScaleAdjuster() {
	const state = useContext(OpenPacksContext);

	createEffect(() => {
		document.cookie = `openPacksScale=${state.cardScale}; path=/`;
	});

	return (
		<div class="flex h-min w-full items-center justify-start gap-x-2 opacity-0 transition-opacity hover:opacity-100">
			<label class="font-heading font-bold text-gray-700">Card Scale</label>
			<input
				type="range"
				min="0.25"
				max="2"
				step="0.001"
				value={state.cardScale}
				class="w-1/2"
				onInput={(e) =>
					state.setCardScale(parseFloat((e.target as HTMLInputElement).value))
				}
			/>
		</div>
	);
}
