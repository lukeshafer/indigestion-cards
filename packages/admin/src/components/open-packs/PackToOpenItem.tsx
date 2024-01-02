import { createSignal, createUniqueId, useContext } from 'solid-js';
import { OpenPacksContext, type PackEntityWithStatus } from './OpenPacksContext';

export function PackToOpenItem(props: { index: number; pack: PackEntityWithStatus }) {
	const state = useContext(OpenPacksContext);

	const isActive = () => props.pack.packId === state.activePack?.packId;
	const isOnline = () => state.getIsOnline(props.pack.username);
	const [isDragging, setIsDragging] = createSignal(false);
	const [isDragOver, setIsDragOver] = createSignal(false);

	return (
		<li
			classList={{ 'bg-gray-300 dark:bg-gray-500': isDragOver() }}
			id={createUniqueId()}
			draggable="true"
			onDragStart={e => {
				const index = props.index
				setIsDragging(true);
				if (!e.dataTransfer) return;
				e.dataTransfer.setData('text', String(index));
				e.dataTransfer.effectAllowed = 'move'
			}}
			onDragEnd={() => setIsDragging(false)}
			onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true) }}
			onDragOver={(e) => e.preventDefault()}
			onDragLeave={() => setIsDragOver(false)}
			onDrop={e => {
				e.preventDefault();
				setIsDragOver(false);
				const fromIndexString = e.dataTransfer?.getData('text');
				const fromIndex = fromIndexString ? parseInt(fromIndexString) : null;
				if (fromIndex === null) return;
				state.movePackToIndex(fromIndex, props.index);
			}}
		>
			<button
				title={isOnline() ? 'Online' : 'Offline'}
				class="font-display -mx-2 mr-2 w-fit min-w-[calc(100%+1rem)] gap-2 whitespace-nowrap px-1 pt-1 text-left italic text-gray-600 hover:bg-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
				classList={{
					'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200': isActive(),
					'opacity-75': !isOnline() && !isActive(),
					'opacity-50': isDragging(),
				}}
				style={{
					'transform-origin': 'center left',
				}}
				onClick={() => state.setActivePack(props.pack)}>
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
