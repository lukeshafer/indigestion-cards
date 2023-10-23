import { Show, useContext } from 'solid-js';
import { OpenPacksContext, type PackEntityWithStatus } from './OpenPacksContext';

export function PackToOpenItem(props: { index: number; pack: PackEntityWithStatus }) {
	const state = useContext(OpenPacksContext);

	let timeout: number | NodeJS.Timeout;
	let wasDragging = false;
	const isActive = () => props.pack.packId === state.activePack?.packId;
	const isDragging = () => state.draggingIndex === props.index;
	const isOnline = () => state.getIsOnline(props.pack.username);

	return (
		<li
			onMouseMove={() => {
				if (!isDragging()) {
					state.setHoveringIndex(props.index);
				}
			}}>
			<Show when={state.hoveringIndex === props.index && state.draggingIndex !== null}>
				<div class="font-display -mx-2 mr-2 h-[1.75em] w-fit min-w-[calc(100%+1rem)] gap-2 whitespace-nowrap bg-gray-300/50 px-1 pt-1 text-left italic dark:bg-gray-500/50" />
			</Show>
			<button
				title={isOnline() ? 'Online' : 'Offline'}
				class="font-display -mx-2 mr-2 w-fit min-w-[calc(100%+1rem)] gap-2 whitespace-nowrap px-1 pt-1 text-left italic text-gray-600 hover:bg-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
				classList={{
					'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200': isActive(),
					'opacity-75': !isOnline() && !isActive(),
					'absolute top-0 opacity-50': isDragging(),
				}}
				style={{
					'transform-origin': 'center left',
					transform: isDragging() ? `translateY(${state.draggingY}px)` : '',
				}}
				onMouseDown={() => {
					timeout = setTimeout(() => {
						state.setDraggingIndex(props.index);
						wasDragging = true;
					}, 100);
				}}
				onClick={() => {
					clearTimeout(timeout);
					if (!isDragging() && wasDragging) {
						wasDragging = false;
						return;
					}
					state.setActivePack(props.pack);
				}}>
				<span
					class="mb-1 mr-2 inline-block h-2 w-2 rounded-full"
					classList={{
						'bg-brand-main': isOnline(),
						'': !isOnline(),
					}}></span>
				{props.pack.username}
			</button>
		</li>
	);
}
