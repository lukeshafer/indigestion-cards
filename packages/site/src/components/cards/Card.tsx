import TiltCardEffect from './TiltCardEffect';
import { ASSETS, FULL_ART_ID, LEGACY_CARD_ID, NO_CARDS_OPENED_ID } from '@site/constants';
import type { CardInstance } from '@core/types';

import { type JSX, Show, type Component, type ParentComponent, type FlowComponent } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';

interface Props extends Partial<CardInstance> {
	rarityName: string;
	frameUrl: string;
	imgUrl: string;
	cardName: string;
	cardDescription: string;
	designId: string;
	cardNumber: number;
	totalOfType: number;
	scale?: number | string;
	instanceId?: string;
	rarityColor: string;
	rarityId: string;
	username?: string;
	adminSecret?: string;
}

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

export default function OldCard(
	props: Props & {
		lazy?: boolean;
	}
) {
	const isFullArt = () => props.rarityId === FULL_ART_ID;
	const isLegacy = () => props.rarityId === LEGACY_CARD_ID;
	const isSecret = () => props.rarityId === NO_CARDS_OPENED_ID;
	const cardName = () => (isFullArt() || isLegacy() || isSecret() ? '' : props.cardName);
	const cardDescription = () =>
		isFullArt() || isLegacy() || isSecret() ? '' : props.cardDescription;
	//const frameUrl = () => (isSecret() ? '' : props.frameUrl);
	//const imgUrl = () => props.imgUrl;

	const isShitPack = () => props.stamps?.includes('shit-pack');
	const shitStampPath = () => {
		if (props.rarityId.startsWith('bronze')) return ASSETS.STAMPS.SHIT.BRONZE;
		else if (props.rarityId.startsWith('silver')) return ASSETS.STAMPS.SHIT.SILVER;
		else if (props.rarityId.startsWith('gold')) return ASSETS.STAMPS.SHIT.GOLD;
		else if (props.rarityId.startsWith('white')) return ASSETS.STAMPS.SHIT.WHITE;
		else if (props.rarityId.startsWith('rainbow')) return ASSETS.STAMPS.SHIT.RAINBOW;
		else if (props.rarityId.startsWith('pink')) return ASSETS.STAMPS.SHIT.PINK;
		else return ASSETS.STAMPS.SHIT.BRONZE;
	};

	const combinedImgUrl = () => {
		if (isSecret()) return ASSETS.CARDS.CARD_BACK;

		const url = new URL(`https://${import.meta.env.PUBLIC_CARD_CDN_URL}`);
		url.pathname = `/${props.designId}/${props.rarityId}.png`;
		if (props.adminSecret) url.searchParams.set('adminsecret', props.adminSecret);

		return url.toString();
	};

	return (
		<div style={{ 'font-size': `calc(1rem * ${props.scale ?? 1})` }}>
			<TiltCardEffect shiny={true}>
				<article
					class="card-wrapper card-aspect-ratio relative w-[18em] bg-cover text-left"
					style={{
						background: isFullArt()
							? 'radial-gradient(circle at 50% 50%, #404040, #343434, #282828, #1d1d1d, #121212, #000000)'
							: props.rarityColor,
						'view-transition-name': `card-${props.instanceId ?? props.designId}`,
					}}>
					<img
						src={combinedImgUrl()}
						alt={props.cardName}
						loading={props.lazy ? 'lazy' : undefined}
						class="absolute inset-0"
					/>
					<h3 class="font-display absolute left-[12%] top-[4.9%] w-[66%] text-[0.9em] font-bold italic text-slate-900">
						{cardName()}
					</h3>
					<p
						style={{
							'--left': '11.5%',
							top: '69.420%',
							left: 'var(--left)',
							width: 'calc(100% - var(--left) * 2)',
						}}
						class="card-description font-heading absolute p-[0.5em] text-[0.85em] font-medium leading-[1.30em] text-black">
						{cardDescription()}
					</p>
					<Show when={!(isLegacy() || isSecret())}>
						<p
							class="font-display absolute bottom-[0.5em] right-[1em] text-[0.75em] font-bold italic"
							classList={{
								'text-black': !isFullArt(),
								'text-white': isFullArt(),
							}}>
							{props.cardNumber} / {props.totalOfType}
						</p>
					</Show>
					<Show when={isShitPack()}>
						<div class="absolute left-[52%] top-1/2 block w-[15em] -translate-x-1/2 -translate-y-1/2 rotate-12">
							<img
								src={shitStampPath()}
								style={{
									animation: props.stamps?.includes('new-stamp')
										? 'stamp 500ms cubic-bezier(0.44, 1.34, 0.37, 0.99) forwards'
										: undefined,
									'transform-origin': props.stamps?.includes('new-stamp')
										? 'center'
										: undefined,
								}}
								classList={{
									'opacity-80': !props.stamps?.includes('new-stamp'),
								}}
								width="350"
							/>
						</div>
					</Show>
				</article>
			</TiltCardEffect>
		</div>
	);
}

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
				width="350"
			/>
		</div>
	);
};

export const FullAnimatedCardEffect: ParentComponent<{ glowColor?: string }> = props => (
	<TiltEffectWrapper>
		<GlowOnHover color={props.glowColor} />
		{props.children}
		<ShineMouseEffect />
	</TiltEffectWrapper>
);

export const TiltEffectWrapper: ParentComponent<{ angleMultiplier?: number }> = props => {
	let canStop = false;
	let rotateX = 0;
	let rotateY = 0;
	let targetRotateX = 0;
	let targetRotateY = 0;

	let wrapperEl: HTMLDivElement;
	let rotateEl: HTMLDivElement;

	return (
		<div
			ref={wrapperEl!}
			class="group relative w-fit transition-transform duration-100 ease-out"
			style={{ perspective: '900px' }}
			onMouseEnter={() => {
				canStop = false;
				let lastTime = 0;

				requestAnimationFrame(function animate(t) {
					let dt = t - lastTime;
					lastTime = t;

					const result = tiltEffectAnimationFrame({
						rotateX,
						rotateY,
						targetRotateX,
						targetRotateY,
						dt,
					});
					rotateEl.style.setProperty(
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
				});
			}}
			onMouseLeave={() => {
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
			<div ref={rotateEl!}>{props.children}</div>
		</div>
	);
};

export const GlowOnHover: Component<{ color?: string }> = props => (
	<div
		class="duration-400 absolute inset-0 h-full w-full origin-center scale-105 opacity-0 shadow blur-[--blur] transition-all ease-out [--blur:5px] [--default-glow-color:theme(colors.brand.main)] group-focus-within:opacity-100 group-hover:opacity-75 dark:[--default-glow-color:theme(colors.brand.light)]"
		style={{
			'--glow-color-prop': props.color,
			background: 'var(--glow-color-prop, var(--default-glow-color))',
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
			onMouseMove={e => {
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
						Math.max(0.3 - Math.abs(state.x + state.y) / 500, 0.01),
						2
					),
					opacity: 1.0,
					'background-image': `
          radial-gradient(circle, ${RADIAL_GRADIENT_COLOR_INNER} 0%, ${RADIAL_GRADIENT_COLOR_OUTER} 13%, transparent 53%), 
          linear-gradient(-30deg, transparent 35%, ${LINEAR_GRADIENT_COLOR} 50%, transparent 55%)`,
				}}
			/>
		</div>
	);
};

const RADIAL_GRADIENT_COLOR_OUTER = `hsl(var(--hue) 90 90 / 0.1)`;
const RADIAL_GRADIENT_COLOR_INNER = `hsl(100 100 100 / 0.1)`;
const LINEAR_GRADIENT_COLOR = `hsl(var(--hue-rotated) 50 85 / var(--shine-opacity))`;

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
