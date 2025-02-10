import { ASSETS, FULL_ART_ID, LEGACY_CARD_ID, NO_CARDS_OPENED_ID } from '@site/constants';
import {
	type JSX,
	type Component,
	type ParentComponent,
	type FlowComponent,
	onMount,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { Dynamic, Portal } from 'solid-js/web';
import { checkAreAnimationsDisabled } from '@site/lib/client/utils';

export const checkIsFullArt = (rarityId: string): boolean => rarityId === FULL_ART_ID;
export const checkIsLegacyCard = (rarityId: string) => rarityId === LEGACY_CARD_ID;
export const checkIsSecret = (rarityId: string) => rarityId === NO_CARDS_OPENED_ID;
export const checkIfCanShowCardText = (rarityId: string) =>
	!(checkIsFullArt(rarityId) || checkIsLegacyCard(rarityId) || checkIsSecret(rarityId));

export const checkIsShitPack = (stamps?: string[]): boolean =>
	stamps?.includes('shit-pack') ?? false;

export function getShitStampPath(rarityId: string) {
	if (rarityId.startsWith('bronze')) return ASSETS.STAMPS.SHIT.BRONZE;
	else if (rarityId.startsWith('silver')) return ASSETS.STAMPS.SHIT.SILVER;
	else if (rarityId.startsWith('gold')) return ASSETS.STAMPS.SHIT.GOLD;
	else if (rarityId.startsWith('white')) return ASSETS.STAMPS.SHIT.WHITE;
	else if (rarityId.startsWith('rainbow')) return ASSETS.STAMPS.SHIT.RAINBOW;
	else if (rarityId.startsWith('pink')) return ASSETS.STAMPS.SHIT.PINK;
	else return ASSETS.STAMPS.SHIT.BRONZE;
}

export function getCardImageUrl(args: {
	designId: string;
	rarityId: string;
	adminSecret?: string;
}): string {
	if (checkIsSecret(args.rarityId)) return ASSETS.CARDS.CARD_BACK;

	const url = new URL(`https://${import.meta.env.PUBLIC_CARD_CDN_URL}`);
	url.pathname = `/${args.designId}/${args.rarityId}.png`;
	if (args.adminSecret) url.searchParams.set('adminsecret', args.adminSecret);

	return url.toString();
}

export function formatCardNumber(args: { cardNumber: number; totalOfType: number }): string {
	return `${args.cardNumber} / ${args.totalOfType}`;
}

export const cardUtils = {
	checkIsFullArt,
	checkIsLegacyCard,
	checkIsSecret,
	checkIfCanShowCardText,
	checkIsShitPack,
	getShitStampPath,
	getCardImageUrl,
	formatCardNumber,
};

export type CardComponentProps = {
	alt: string;
	lazy: boolean;
	imgSrc: string;
	scale?: number | string;
	background: string | undefined;
	viewTransitionName: string | undefined;
};
export const Card: ParentComponent<CardComponentProps> = props => (
	<div style={{ 'font-size': `calc(1rem * ${props.scale ?? 'var(--card-scale, 1)'})` }}>
		<article
			class="card-wrapper card-aspect-ratio relative w-[18em] bg-cover text-left shadow-xl shadow-black/25"
			style={{
				background: props.background,
				'view-transition-name': props.viewTransitionName,
			}}>
			<img
				src={props.imgSrc}
				alt={props.alt}
				loading={props.lazy ? 'lazy' : undefined}
				class="absolute inset-0"
			/>
			{props.children}
		</article>
	</div>
);

export const CardName: FlowComponent<{ element?: keyof JSX.IntrinsicElements }, string> = props => (
	<Dynamic
		component={props.element || 'h3'}
		class="font-display absolute left-[12%] top-[4.9%] w-[66%] text-[0.9em] font-bold italic text-slate-900">
		{props.children}
	</Dynamic>
);

export const CardDescription: FlowComponent<{}, string> = props => (
	<p
		style={{
			'--left': '11.5%',
			top: '69.420%',
			left: 'var(--left)',
			width: 'calc(100% - var(--left) * 2)',
		}}
		class="card-description font-heading absolute p-[0.5em] text-[0.85em] font-medium leading-[1.30em] text-black">
		{props.children}
	</p>
);

export const CardNumber: FlowComponent<{ color?: 'white' | 'black' }, string> = props => (
	<p
		class="font-display absolute bottom-[0.5em] right-[1em] text-[0.75em] font-bold italic"
		classList={{
			'text-black': props.color === 'black' || !props.color,
			'text-white': props.color === 'white',
		}}>
		{props.children}
	</p>
);

export const FULL_ART_BACKGROUND_CSS =
	'radial-gradient(circle at 50% 50%, #404040, #343434, #282828, #1d1d1d, #121212, #000000)';

export const ShitStamp: Component<{
	src: string;
	animation?: 'slam' | 'none';
}> = props => {
	return (
		<div class="absolute left-[52%] top-1/2 block w-[15em] -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-80">
			<img
				src={props.src}
				style={{
					animation:
						props.animation === 'slam'
							? 'stamp 500ms cubic-bezier(0.44, 1.34, 0.37, 0.99) forwards'
							: undefined,
					'transform-origin': props.animation === 'slam' ? 'center' : undefined,
				}}
			/>
		</div>
	);
};

export const CardLinkWrapper: ParentComponent<{
	href: string;
	title?: string;
}> = props => (
	<a
		href={props.href}
		title={props.title}
		class="outline-brand-main group inline-block transition-transform focus-within:-translate-y-2 hover:-translate-y-2">
		{props.children}
	</a>
);

export const FullAnimatedCardEffect: ParentComponent<{ glowColor?: string }> = props => (
	<TiltEffectWrapper>
		<GlowOnHover color={props.glowColor} />
		{props.children}
		<ShineMouseEffect />
	</TiltEffectWrapper>
);

function clamp(min: number, target: number, max: number) {
	return Math.max(min, Math.min(target, max));
}

export const TiltEffectWrapper: ParentComponent<{
	angleMultiplier?: number;
	transformOrigin?: string;
}> = props => {
	let canStop = false;
	let rotateX = 0;
	let rotateY = 0;
	let targetRotateX = 0;
	let targetRotateY = 0;

	let wrapperEl: HTMLDivElement;
	let rotateEl: HTMLDivElement;

	let prevTime = 0;
	function animate(t: number) {
		if (checkAreAnimationsDisabled()) {
			return;
		}

		let dt = t - prevTime;
		prevTime = t;

		const result = tiltEffectAnimationFrame({
			rotateX,
			rotateY,
			targetRotateX,
			targetRotateY,
			dt,
		});
		rotateEl!.style.setProperty(
			'transform',
			`rotate3d(${result.rotateY}, ${result.rotateX}, 0, ${result.rotateDegrees * (props.angleMultiplier ?? 1)}deg)`
		);

		rotateX = result.rotateX;
		rotateY = result.rotateY;

		if (
			roundTo(result.rotateX, 1) !== 0 ||
			roundTo(result.rotateY, 1) !== 0 ||
			canStop === false
		) {
			requestAnimationFrame(animate);
		}
	}

	onMount(() => {
		wrapperEl!.addEventListener('touchmove', e => {
			const bounds = wrapperEl!.getBoundingClientRect();
			const touches = e.touches[0];
			if (!bounds || !touches) return;
			e.preventDefault();

			targetRotateX = clamp(
				-bounds.x / 2,
				Math.floor(((touches.clientX - bounds.x) / bounds.width - 0.5) * 100),
				bounds.x / 2
			);
			targetRotateY = clamp(
				-bounds.y / 2,
				Math.floor((0.5 - (touches.clientY - bounds.y) / bounds.height) * 100),
				bounds.y / 2
			);
		});
	});
	return (
		<div
			ref={wrapperEl!}
			class="group relative w-fit transition-transform duration-100 ease-out"
			style={{ perspective: '900px' }}
			onMouseEnter={() => {
				canStop = false;
				requestAnimationFrame(animate);
			}}
			onTouchStart={() => {
				canStop = false;
				requestAnimationFrame(animate);
			}}
			onMouseLeave={() => {
				canStop = true;
				targetRotateY = 0;
				targetRotateX = 0;
			}}
			onTouchEnd={() => {
				canStop = true;
				targetRotateY = 0;
				targetRotateX = 0;
			}}
			onMouseMove={e => {
				const bounds = e.currentTarget.getBoundingClientRect();
				if (!bounds) return;

				targetRotateX = Math.floor((0.5 - (e.x - bounds.x) / bounds.width) * 100);
				targetRotateY = Math.floor(((e.y - bounds.y) / bounds.height - 0.5) * 100);
			}}>
			<div
				ref={rotateEl!}
				style={{
					'transform-origin': props.transformOrigin ?? 'center',
				}}>
				{props.children}
			</div>
		</div>
	);
};

export const GlowOnHover: Component<{ color?: string; focusOnly?: boolean }> = props => (
	<div
		class="duration-400 absolute inset-0 h-full w-full origin-center scale-105 opacity-0 shadow blur-[--blur] transition-all ease-out [--blur:5px] group-focus:opacity-100"
		classList={{
			'bg-brand-main dark:bg-brand-light': !props.color,
			'group-hover:opacity-75': props.focusOnly !== true,
		}}
		style={{
			background: props.color || undefined,
		}}
	/>
);

const SIZE = 18.75;
export const ShineMouseEffect: Component = () => {
	const [state, setState] = createStore({
		x: 0,
		y: 0,
	});

	return (
		<div
			class="absolute inset-0 h-full w-full overflow-hidden opacity-0 mix-blend-color-dodge transition-opacity group-hover:opacity-100"
			onTouchStart={e => {
				if (checkAreAnimationsDisabled()) {
					e.currentTarget.classList.remove('opacity-100');
					return;
				} else {
					e.currentTarget.classList.add('opacity-100');
				}
			}}
			onTouchEnd={e => {
				console.log('touch end');
				e.currentTarget.classList.remove('opacity-100');
			}}
			onTouchMove={e => {
				if (checkAreAnimationsDisabled()) {
					e.currentTarget.classList.remove('group-hover:opacity-100');
					return;
				} else {
					e.currentTarget.classList.add('group-hover:opacity-100');
				}

				const touches = e.touches[0];
				const bounds = e.currentTarget.getBoundingClientRect();
				setState({
					x: -(touches.clientX - bounds.x - SIZE * 8),
					y: -(touches.clientY - bounds.y - SIZE * 8),
				});
			}}
			onMouseMove={e => {
				if (checkAreAnimationsDisabled()) {
					e.currentTarget.classList.remove('group-hover:opacity-100');
					return;
				} else {
					e.currentTarget.classList.add('group-hover:opacity-100');
				}

				const bounds = e.currentTarget.getBoundingClientRect();
				if (!bounds) return;
				setState({
					x: e.x - bounds.x - SIZE * 8,
					y: e.y - bounds.y - SIZE * 8,
				});
			}}>
			<div
				class="duration-800 absolute left-0 top-0 scale-[3] mix-blend-color-dodge"
				style={{
					// good mix-blend options: overlay, color-dodge
					translate: `${state.x}px ${state.y}px`,
					'--hue': `${state.x + state.y / 2 + 100}deg`,
					'--hue-rotated': 'calc(var(--hue) - 180deg)',
					height: `${SIZE}em`,
					width: `${SIZE}em`,
					'--shine-opacity': roundTo(
						Math.max(0.4 - Math.abs((state.x + state.y) * 0.75) / 500, 0.01),
						2
					),
					opacity: 1.0,
					'background-image': `
          radial-gradient(circle, 
            ${RADIAL_GRADIENT_COLOR_INNER} 0%, 
            ${RADIAL_GRADIENT_COLOR_OUTER} 13%, 
            transparent 53%
          ), 
          linear-gradient(-30deg, 
            transparent 35%, 
            ${LINEAR_GRADIENT_COLOR} 55%, 
            transparent 60%
          )`,
				}}
			/>
		</div>
	);
};

export const CardPreview: ParentComponent<{ close: () => void }> = props => (
	<Portal mount={document.getElementById('card-preview') ?? undefined}>
		<div
			class="absolute inset-0 z-50 m-auto flex h-full w-full items-center justify-center pt-4 backdrop-blur-sm"
			onClick={() => props.close()}>
			{props.children}
		</div>
	</Portal>
);

export const CardEls = {
	Card,
	CardName,
	CardDescription,
	CardNumber,
	ShitStamp,
	CardLinkWrapper,
	FullAnimatedCardEffect,
	TiltEffectWrapper,
	GlowOnHover,
	ShineMouseEffect,
};

const RADIAL_GRADIENT_COLOR_OUTER = `hsl(var(--hue) 90 90 / 0.1)`;
const RADIAL_GRADIENT_COLOR_INNER = `hsl(100 100 100 / 0.1)`;
const LINEAR_GRADIENT_COLOR = `hsl(var(--hue-rotated) 30 75 / var(--shine-opacity))`;

const MAX_MOVE = 8;
function tiltEffectAnimationFrame(args: {
	targetRotateX: number;
	targetRotateY: number;
	rotateX: number;
	rotateY: number;
	dt: number;
}) {
	let rotateX = args.rotateX;
	let rotateY = args.rotateY;
	if (args.rotateX !== args.targetRotateX) {
		if (Math.abs(args.targetRotateX - args.rotateX) < MAX_MOVE) {
			rotateX = args.targetRotateX;
		} else {
			let dx = (args.targetRotateX - args.rotateX) * args.dt * args.dt;
			rotateX += dx > 0 ? Math.min(dx, MAX_MOVE) : Math.max(dx, -MAX_MOVE);
		}
	}
	if (args.rotateY !== args.targetRotateY) {
		if (Math.abs(args.targetRotateY - args.rotateY) < MAX_MOVE) {
			rotateY = args.targetRotateY;
		} else {
			let dy = (args.targetRotateY - args.rotateY) * args.dt;
			rotateY += dy > 0 ? Math.min(dy, MAX_MOVE) : Math.max(dy, -MAX_MOVE);
		}
	}

	let rotateDegrees = Math.max(Math.abs(rotateX) + Math.abs(rotateY)) * 0.2;
	return { rotateX: roundTo(rotateX, 5), rotateY: roundTo(rotateY, 5), rotateDegrees };
}

function roundTo(input: number, decimals: number) {
	const multiplyAmount = Math.pow(10, decimals);
	return Math.round(input * multiplyAmount) / multiplyAmount;
}
