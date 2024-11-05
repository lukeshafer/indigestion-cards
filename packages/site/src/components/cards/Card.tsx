import TiltCardEffect from './TiltCardEffect';
import { ASSETS, FULL_ART_ID, LEGACY_CARD_ID, NO_CARDS_OPENED_ID } from '@site/constants';
import type { CardInstance } from '@core/types';

import { type JSX, Show, type Component, type ParentComponent } from 'solid-js';
import { createStore } from 'solid-js/store';

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
	legacy: boolean;
	secret: boolean;
	scale: number | string;
	cardName: string | false;
	centerStamp: JSX.Element | null;
	cardDescription: string | false;
	backgroundCSS: string | undefined;
	cardNumberString: string | undefined;
	viewTransitionName: string | undefined;
	cardNumberColor: 'black' | 'white' | undefined;
};
export const Card: Component<CardComponentProps> = props => (
	<div style={{ 'font-size': `calc(1rem * ${props.scale ?? 1})` }}>
		<article
			class="card-wrapper card-aspect-ratio relative w-[18em] bg-cover text-left shadow-xl shadow-black/25"
			style={{
				background: props.backgroundCSS,
				'view-transition-name': props.viewTransitionName,
			}}>
			<img
				src={props.imgSrc}
				alt={props.alt}
				loading={props.lazy ? 'lazy' : undefined}
				class="absolute inset-0"
			/>
			<Show when={props.cardName}>
				{cardName => (
					<h3 class="font-display absolute left-[12%] top-[4.9%] w-[66%] text-[0.9em] font-bold italic text-slate-900">
						{cardName()}
					</h3>
				)}
			</Show>
			<Show when={props.cardDescription}>
				{description => (
					<p
						style={{
							'--left': '11.5%',
							top: '69.420%',
							left: 'var(--left)',
							width: 'calc(100% - var(--left) * 2)',
						}}
						class="card-description font-heading absolute p-[0.5em] text-[0.85em] font-medium leading-[1.30em] text-black">
						{description()}
					</p>
				)}
			</Show>
			<Show when={props.cardNumberString}>
				<p
					class="font-display absolute bottom-[0.5em] right-[1em] text-[0.75em] font-bold italic"
					classList={{
						'text-black': props.cardNumberColor === 'black' || !props.cardNumberColor,
						'text-white': props.cardNumberColor === 'white',
					}}>
					{props.cardNumberString}
				</p>
			</Show>
			{props.centerStamp}
		</article>
	</div>
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

export const TiltEffect: ParentComponent = props => {
	const SIZE = 18.75;

	const [animationState, setAnimationState] = createStore({
		isVisible: false,
		canStop: false,
		mouseX: 0,
		mouseY: 0,
		rotateX: 0,
		rotateY: 0,
		targetRotateX: 0,
		targetRotateY: 0,
		element: null as HTMLDivElement | null,
		get hue() {
			return `${animationState.mouseX + animationState.mouseY / 2 + 100}deg`;
		},
		get shineOpacity() {
			return animationState.isVisible
				? Math.round(
						Math.max(
							0.5 - Math.abs(animationState.mouseY + animationState.mouseX) / 400,
							0
						) * 100
					) / 100
				: 0;
		},
		//get tiltMagnitude() {
		//	return (
		//		Math.floor(
		//			Math.sqrt(Math.pow(this.rotateX, 2) + Math.pow(this.rotateY, 2)) * 15000
		//		) / 100
		//	);
		//},
	});

	let rotateEl: HTMLDivElement;

	const startAnimation = () => {
		setAnimationState('canStop', false);
		const { kill } = setupAnimationFrame(dt => {
			const result = tiltEffectAnimationFrame({ ...animationState, dt });
			rotateEl.style.setProperty(
				'transform',
				`rotate3d(${result.rotateY}, ${result.rotateX}, 0, ${result.rotateDegrees}deg)`
			);

			setAnimationState({
				rotateX: result.rotateX,
				rotateY: result.rotateY,
			});

			if (
				roundTo(result.rotateX, 2) === 0 &&
				roundTo(result.rotateY, 2) === 0 &&
				animationState.canStop === true
			) {
				kill();
			}
		});
	};

	return (
		<>
			<div
				ref={el => setAnimationState('element', el)}
				class="shover:-translate-y-2 relative w-fit transition-transform duration-100 ease-out hover:scale-105"
				style={{
					'--mouse-x': `${animationState.mouseX}px`,
					'--mouse-y': `${animationState.mouseY}px`,
					'--hue': animationState.hue,
					'--shine-opacity': animationState.shineOpacity,
					perspective: '900px',
				}}
				onMouseEnter={() => {
					setAnimationState('isVisible', true);
					startAnimation();
				}}
				onMouseLeave={() => {
					setAnimationState('isVisible', false);
					setAnimationState({
						isVisible: false,
						canStop: true,
						targetRotateY: 0,
						targetRotateX: 0,
					});
				}}
				onMouseMove={e => {
					const bounds = animationState.element?.getBoundingClientRect();
					if (!bounds) return;

					setAnimationState({
						mouseX: e.x - bounds.x - SIZE * 8,
						mouseY: e.y - bounds.y - SIZE * 8,
						targetRotateX: Math.floor((0.5 - (e.x - bounds.x) / bounds.width) * 100),
						targetRotateY: Math.floor(((e.y - bounds.y) / bounds.height - 0.5) * 100),
					});
				}}>
				<div ref={rotateEl!}>
					{props.children}
					<div class="absolute inset-0 h-full w-full overflow-hidden">
						<div
							style={{
								'--y': 'calc(var(--mouse-y) / 2)',
								'--hue-rotated': 'calc(var(--hue) - 180deg)',
								height: `${SIZE}em`,
								width: `${SIZE}em`,
								opacity: animationState.isVisible ? 0.4 : 0,
								'background-image':
									'radial-gradient(circle, hsl(var(--hue) 100 90 / 0.3) 0%, #ffffff00 53%), linear-gradient(-30deg, transparent 40%, hsl(var(--hue-rotated) 100 90 / var(--shine-opacity)) 50%, transparent 60%)',
							}}
							class="absolute left-0 top-0 translate-x-[--mouse-x] translate-y-[--y] scale-[3] transition-opacity"></div>
					</div>
				</div>
			</div>
			{
				//
				//<pre>{JSON.stringify(animationState, null, 2)}</pre>
			}
		</>
	);
};

const MAX_MOVE = 10;
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

	let rotateDegrees = Math.max(Math.abs(rotateX) + Math.abs(rotateY)) * 0.1;
	return { rotateX: roundTo(rotateX, 5), rotateY: roundTo(rotateY, 5), rotateDegrees };
}

type AnimationFrameOutput = { kill: () => void };
const setupAnimationFrame = (cb: (dt: number, t: number) => void): AnimationFrameOutput => {
	let lastTime = 0;
	let killed = false;
	const animation: FrameRequestCallback = t => {
		let dt = t - lastTime;
		lastTime = t;
		cb(dt, t);
		if (!killed) {
			requestAnimationFrame(animation);
		}
	};

	requestAnimationFrame(animation);

	return {
		kill: () => (killed = true),
	};
};

function roundTo(input: number, decimals: number) {
	const multiplyAmount = Math.pow(10, decimals);
	return Math.round(input * multiplyAmount) / multiplyAmount;
}
