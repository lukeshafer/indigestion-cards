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
			const expires = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
			document.cookie = `openPacksMargin=${state.listHeight ?? ''}; path=/; expires=${expires.toUTCString()}`;
		};
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	return (
		<button
			class="font-heading relative z-10 h-min w-full max-w-[15rem] translate-y-3/4 bg-transparent pb-1 text-center text-2xl font-bold leading-none opacity-0 transition-opacity hover:cursor-ns-resize hover:opacity-50"
			onMouseDown={handleMouseDown}>
			=
		</button>
	);
}
