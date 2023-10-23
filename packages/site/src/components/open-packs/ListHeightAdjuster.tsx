import { useContext } from 'solid-js';
import { OpenPacksContext } from './OpenPacksContext';

export function ListHeightAdjuster() {
	const state = useContext(OpenPacksContext);

	const handleMouseDown = (e: MouseEvent) => {
		e.preventDefault();
		let prevY = e.clientY / 1;
		const handleMouseMove = (e: MouseEvent) => {
			state.setListHeight(Math.max(state.listHeight + (e.clientY / 1 - prevY), 0));
			prevY = e.clientY / 1;
		};
		const handleMouseUp = () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
			// set the margin in a cookie
			document.cookie = `openPacksMargin=${state.listHeight ?? ''}; path=/`;
		};
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	return (
		<button
			class="font-heading relative z-10 h-min w-full max-w-[15rem] translate-y-1/2 bg-transparent pb-1 text-center text-2xl font-bold opacity-0 transition-opacity hover:cursor-ns-resize hover:opacity-50"
			onMouseDown={handleMouseDown}>
			=
		</button>
	);
}
