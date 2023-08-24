import { onCleanup } from "solid-js";

export const useViewTransition = (cb: () => any) =>
	// @ts-ignore
	document.startViewTransition ? document.startViewTransition(cb) : cb();

export function clickOutside(el: Element, accessor: () => any) {
	const onClick = (e: MouseEvent) => !el.contains(e.target as Element) && accessor()?.();
	document.body.addEventListener('click', onClick);

	onCleanup(() => document.body.removeEventListener('click', onClick));
}
