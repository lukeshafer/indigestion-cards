import { createSignal, onMount } from 'solid-js';

export default function LoadingBar() {
	const [width, setWidth] = createSignal('0');
	const [isVisible, setIsVisible] = createSignal(true);

	onMount(() => {
		document.addEventListener('astro:before-preparation', () => {
			setWidth('30%');
			setIsVisible(true);
		});
		document.addEventListener('astro:after-preparation', () => setWidth('50%'));
		document.addEventListener('astro:before-swap', () => setWidth('80%'));
		document.addEventListener('astro:after-swap', () => setWidth('90%'));
		document.addEventListener('astro:page-load', () => {
			setWidth('100%');
			setTimeout(() => setIsVisible(false), 250);
			setTimeout(() => setWidth('0%'), 500);
		});
	});

	return (
		<div
			class="bg-brand-main fixed left-0 right-0 top-0 block h-[2px]"
			style={{
				width: width(),
				opacity: isVisible() ? '1' : '0',
				'transition-property': 'width, opacity',
				'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
				'transition-duration': '250ms',
				'transition-delay': '0, 250ms'
			}}></div>
	);
}
