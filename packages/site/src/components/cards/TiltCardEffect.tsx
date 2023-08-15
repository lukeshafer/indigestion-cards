import { createStore } from 'solid-js/store';
import { JSX, createSignal, onMount } from 'solid-js';
import styles from './TiltCardEffect.module.css';

export default function TiltCardEffect(props: { children?: JSX.Element; shiny?: boolean }) {
	const [state, setState] = createStore({
		transition: 'transform 0.1s linear',
		shinePosition: '50%',
		shineAfterOpacity: '0',
		transform: 'rotate3d(0, 0, 0, 0deg)',
		shineOpacity: '0',
		shadow: '0',
	});

	const [outerEl, setOuterEl] = createSignal<HTMLDivElement>();

	function cardTilt(el: HTMLDivElement) {
		el.addEventListener('mouseenter', handleEnterEvent);
		el.addEventListener('touchstart', handleEnterEvent);

		function handleEnterEvent() {
			if (
				window.localStorage.getItem('disableAnimations') === 'true' ||
				document.body.classList.contains('disable-animations')
			) {
				outerEl()!.style.transition = 'transform 0.0s';
				return;
			}
			el.addEventListener('mousemove', handleMoveEvent);
			el.addEventListener('touchmove', handleMoveEvent);
			el.addEventListener('mouseleave', handleLeaveEvent);
			el.addEventListener('touchend', handleLeaveEvent);

			outerEl()!.style.removeProperty('transition');
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
			if (!outerEl()) return;

			const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
			const { left, top, width, height } = outerEl()!.getBoundingClientRect();

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

	return (
		<div class={styles.outer} ref={setOuterEl} use:cardTilt>
			<div
				class={styles.inner}
				classList={{ [styles.shiny]: props.shiny ?? false }}
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
