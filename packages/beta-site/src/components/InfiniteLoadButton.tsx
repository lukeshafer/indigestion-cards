import type { Component } from 'solid-js';
import type { CardComponentProps } from './Card';

/// LOAD BUTTON
const InfiniteLoadButton: Component<{ load: () => Promise<any>; children?: string }> = props => (
	<button
		class="border-brand-500 relative m-8 mx-auto w-full max-w-52 border p-2"
		onClick={() => props.load()}>
		<div
			class="absolute -top-96 h-px w-px"
			ref={div => setupIntersectionObserver({ div, load: props.load })}
		/>
		{props.children || 'Click to load more.'}
	</button>
);
export default InfiniteLoadButton;

function setupIntersectionObserver(args: { load(): Promise<any>; div: HTMLDivElement }): void {
	const observer = new IntersectionObserver(entries => {
		for (let entry of entries) {
			if (entry.isIntersecting) {
				const viewportHeight = entry.rootBounds?.height ?? 0;
				(function load(count = 0) {
					args.load().then(() => {
						if (!entry.target.checkVisibility()) {
							return;
						}
						if (count > 50)
							throw new Error('Loaded too many times: there is likely a bug');
						setTimeout(() => {
							if (entry.target.getBoundingClientRect().top < viewportHeight) {
								load(count + 1);
							}
						}, 50);
					});
				})();
			}
		}
	});

	observer.observe(args.div);
	observer.takeRecords;
}
