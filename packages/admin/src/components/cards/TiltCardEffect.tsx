import { createStore, type SetStoreFunction } from 'solid-js/store';
import type { JSX } from 'solid-js';
import { css } from '@acab/ecsstatic';

interface TiltCardState {
	transition: string;
	shinePosition: string;
	shineAfterOpacity: string;
	transform: string;
	shineOpacity: string;
	shadow: string;
}

export default function TiltCardEffect(props: { children?: JSX.Element; shiny?: boolean }) {
	const [state, setState] = createStore<TiltCardState>({
		transition: 'transform 0.1s linear',
		shinePosition: '50%',
		shineAfterOpacity: '0',
		transform: 'rotate3d(0, 0, 0, 0deg)',
		shineOpacity: '0',
		shadow: '0',
	});

	return (
		<div class={styles.outer} ref={(el) => cardTilt(el, setState)}>
			<div
				class={styles.inner}
				classList={{ shiny: props.shiny ?? false }}
				style={{
					'--shine-position': state.shinePosition,
					'--shine-opacity': state.shineOpacity,
					'--shine-after-opacity': state.shineAfterOpacity,
					'--shadow': state.shadow,
					transform: state.transform,
					transition: state.transition,
				}}>
				{props.children}
			</div>
		</div>
	);
}

function cardTilt(el: HTMLDivElement, setState: SetStoreFunction<TiltCardState>) {
	el.addEventListener('mouseenter', handleEnterEvent);
	el.addEventListener('touchstart', handleEnterEvent);

	function handleEnterEvent() {
		if (
			window.localStorage.getItem('disableAnimations') === 'true' ||
			document.body.classList.contains('disable-animations')
		) {
			el.style.transition = 'transform 0.0s';
			return;
		}
		el.addEventListener('mousemove', handleMoveEvent);
		el.addEventListener('touchmove', handleMoveEvent);
		el.addEventListener('mouseleave', handleLeaveEvent);
		el.addEventListener('touchend', handleLeaveEvent);

		el.style.removeProperty('transition');
		setState('shineAfterOpacity', '1');
		setTimeout(() => {
			setState('transition', 'transform 0.0s');
		}, 500);
	}

	function handleMoveEvent(e: MouseEvent | TouchEvent) {
		if (
			window.localStorage.getItem('disableAnimations') === 'true' ||
			document.body.classList.contains('disable-animations')
		)
			return;

		if (e.type === 'touchmove') e.preventDefault();
		if (!el) return;

		const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
		const { left, top, width, height } = el.getBoundingClientRect();

		const x = Math.min(Math.max((clientX - left) / width - 0.5, -0.5), 0.5);
		const y = Math.min(Math.max((clientY - top) / height - 0.5, -0.5), 0.5);
		const angle = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) * 70;

		setState({
			transform: `rotate3d(${y}, ${-x}, 0, ${angle}deg)`,
			shinePosition: `${60 - (-x + 0.5) * 60 + (40 - (-y + 0.5) * 40)}%`,
			shineOpacity: `${y + (x - 0.1) / 2}`,
			shadow: `${-y}`,
		});
	}

	function handleLeaveEvent() {
		el.removeEventListener('mousemove', handleMoveEvent);
		el.removeEventListener('touchmove', handleMoveEvent);
		el.removeEventListener('mouseleave', handleLeaveEvent);
		el.removeEventListener('touchend', handleLeaveEvent);

		if (
			window.localStorage.getItem('disableAnimations') === 'true' ||
			document.body.classList.contains('disable-animations')
		)
			return;
		setState({
			transition: 'transform 0.1s linear',
			shinePosition: '50%',
			shineAfterOpacity: '0',
			transform: 'rotate3d(0, 0, 0, 0deg)',
			shineOpacity: '0.0',
		});
	}
}

const styles = {
	outer: css`
		width: max-content;
		position: relative;
		transform-style: preserve-3d;
		transition:
			transform 0.3s,
			scale 0.3s;
		perspective: 900px;
		z-index: 1;

		--shine-opacity: 0.2;
		--shine-position: 50%;
		--shine-after-opacity: 0;
		--shadow: 0;

		&:hover {
			transform: translateZ(300px);
		}
	`,
	inner: css`
		&::before,
		&::after {
			transform: translateZ(200px);
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			display: block;
			z-index: 1;
			content: '';

			background-position: var(--shine-position) 0%;
			opacity: var(--shine-after-opacity);
			transition: opacity 0.5s;
			background-repeat: no-repeat;
		}

		&::after {
			--shine-level: clamp(0.05, calc(0.5 * var(--shadow)), 1);
			background-size: 300% 200%;
			background-image: radial-gradient(
				ellipse at center,
				rgba(49, 52, 56, var(--shine-level)) 0%,
				rgba(49, 52, 56, calc(var(--shine-level) / 100)) 100%
			);
		}

		&.shiny::before {
			--adjusted: calc(var(--shine-opacity) - 0.5);
			--sq: calc(1 - 3 * var(--adjusted) * var(--adjusted));
			--shine-level: clamp(0.1, calc(0.6 * var(--sq)), 0.9);
			background-size: 200% 110%;
			background-image: linear-gradient(
				110deg,
				#fff0 0%,
				hsl(calc(var(--shine-opacity) * 360) 100% 95% / 25%) 10%,
				#fff3 20%,
				hsl(calc(var(--shine-opacity) * 360) 100% 95% / var(--shine-level)) 35%,
				rgb(255 255 255 / var(--shine-level)) 40%,
				hsl(calc(var(--shine-opacity) * 360 + 180) 100% 95% / var(--shine-level)) 50%,
				#fff3 80%,
				#fff0 100%
			);
		}
	`,
};
