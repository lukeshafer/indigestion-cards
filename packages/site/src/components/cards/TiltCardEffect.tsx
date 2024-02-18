import { createStore } from 'solid-js/store';
import type { JSX } from 'solid-js';
import styles from './TiltCardEffect.module.css';

export default function TiltCardEffect(props: { children?: JSX.Element; shiny?: boolean }) {
	const defaultState = {
		transitionDuration: '0.1s',
		isShineVisible: false,
		x: 0,
		y: 0,
	};
	const [state, setState] = createStore({ ...defaultState });
	const resetCard = () => setState(defaultState);

	function cardTilt(el: HTMLDivElement) {
		el.addEventListener('mouseenter', handleEnterEvent);

		function handleEnterEvent() {
			if (
				window.localStorage.getItem('disableAnimations') === 'true' ||
				document.body.classList.contains('disable-animations')
			) {
				el.style.transition = 'transform 0.0s';
				return;
			}
			el.addEventListener('mousemove', handleMoveEvent);
			//el.addEventListener('touchmove', handleMoveEvent);
			el.addEventListener('mouseleave', handleLeaveEvent);
			//el.addEventListener('touchend', handleLeaveEvent);

			el.style.removeProperty('transition');
			setState('isShineVisible', true);
			setTimeout(() => setState('transitionDuration', '0.0s'), 150);
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

			setState({ x, y });
		}

		function handleLeaveEvent() {
			el.removeEventListener('mousemove', handleMoveEvent);
			//el.removeEventListener('touchmove', handleMoveEvent);
			el.removeEventListener('mouseleave', handleLeaveEvent);
			//el.removeEventListener('touchend', handleLeaveEvent);

			if (
				window.localStorage.getItem('disableAnimations') === 'true' ||
				document.body.classList.contains('disable-animations')
			)
				return;

			resetCard();
		}
	}

	return (
		<div class={styles.outer} ref={cardTilt}>
			<div
				class={styles.inner}
				classList={{ [styles.shiny]: props.shiny ?? false }}
				style={{
					'--x': String(state.x),
					'--y': String(state.y),
					'--shine-after-opacity': state.isShineVisible ? '1' : '0',
					'transition-duration': state.transitionDuration,
				}}>
				{props.children}
			</div>
		</div>
	);
}
