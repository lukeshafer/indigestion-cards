import { ASSETS, FULL_ART_ID, LEGACY_CARD_ID, NO_CARDS_OPENED_ID } from '@site/constants';
import { Show, type Component, type ParentComponent } from 'solid-js';
import { createStore } from 'solid-js/store';

export interface CardComponentProps {
	cardName: string;
	cardDescription: string;
	designId: string;
	cardNumber: number;
	totalOfType: number;
	scale?: number | string;
	instanceId?: string;
	rarityColor: string;
	rarityId: string;
	stamps?: Array<string>;
	adminSecret?: string;
	lazy?: boolean;
}

export const Card: Component<CardComponentProps> = props => {
	const flags = getCardFlags(props);
	const displayName = () =>
		flags.isLegacy || flags.isSecret || flags.isFullArt ? '' : props.cardName;
	const displayDescription = () =>
		flags.isLegacy || flags.isSecret || flags.isFullArt ? '' : props.cardDescription;
	const shitStampImage = () => getShitStampImage(props.rarityId);
	const imageUrl = createImageUrl(props, flags);

	return (
		<article
			class="card-wrapper card-aspect-ratio relative w-[18em] bg-cover text-left text-gray-950 shadow-xl shadow-black/50"
			style={{
				'font-size': `calc(0.85rem * ${props.scale ?? 1})`,
				background: flags.isFullArt
					? 'radial-gradient(circle at 50% 50%, #404040, #343434, #282828, #1d1d1d, #121212, #000000)'
					: props.rarityColor,
				'view-transition-name': `card-${props.instanceId ?? props.designId}`,
			}}>
			<img
				src={imageUrl()}
				alt={props.cardName}
				loading={props.lazy ? 'lazy' : undefined}
				class="absolute inset-0"
			/>
			<h3 class="font-display absolute left-[12%] top-[4.9%] w-[66%] text-[0.9em] font-bold italic text-gray-900">
				{displayName()}
			</h3>
			<p
				style={{
					'--left': '11.5%',
					top: '69.420%',
					width: 'calc(100% - var(--left) * 2)',
					left: 'var(--left)',
				}}
				class="card-description font-heading absolute p-[0.5em] text-[0.85em] font-medium leading-[1.30em] text-black">
				{displayDescription()}
			</p>
			<Show when={!(flags.isSecret || flags.isLegacy)}>
				<p
					class="font-display absolute bottom-[0.5em] right-[1em] text-[0.75em] font-bold italic"
					classList={{
						'text-black': !flags.isFullArt,
						'text-white': flags.isFullArt,
					}}>
					{props.cardNumber} / {props.totalOfType}
				</p>
			</Show>
			<Show when={flags.isShitPack}>
				<div class="absolute left-[52%] top-1/2 block w-[15em] -translate-x-1/2 -translate-y-1/2 rotate-12">
					<img
						src={shitStampImage()}
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
	);
};

export const AnimatedCard: ParentComponent = props => {
	const SIZE = 18.75;

	const [animationState, setAnimationState] = createStore({
		isVisible: false,
		mouseX: 0,
		mouseY: 0,
		rotateX: 0,
		rotateY: 0,
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
	});

	return (
		<div
			ref={el => setAnimationState('element', el)}
			class="relative w-fit transition-transform duration-100 ease-out hover:-translate-y-2 hover:scale-[1.02]"
			style={{
				'--mouse-x': `${animationState.mouseX}px`,
				'--mouse-y': `${animationState.mouseY}px`,
				'--hue': animationState.hue,
				'--shine-opacity': animationState.shineOpacity,
				'--rotate-x': animationState.rotateX,
				'--rotate-y': animationState.rotateY,
				perspective: '800px',
			}}
			onMouseEnter={e => {
				setAnimationState('isVisible', true);
			}}
			onMouseLeave={e => {
				setAnimationState('isVisible', false);
				setAnimationState('rotateX', 0);
				setAnimationState('rotateY', 0);
			}}
			onMouseMove={e => {
				const bounds = animationState.element?.getBoundingClientRect();
				if (!bounds) return;

				setAnimationState({
					mouseX: e.x - bounds.x - SIZE * 8,
					mouseY: e.y - bounds.y - SIZE * 8,
					rotateX: (0.5 - (e.x - bounds.x) / bounds.width) * 0.1,
					rotateY: ((e.y - bounds.y) / bounds.height - 0.5) * 0.1,
				});
			}}>
			<div
				style={{
					transform: 'rotate3d(var(--rotate-y), var(--rotate-x), 0, 10deg)',
				}}>
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
			{
				//
				//<pre>{JSON.stringify(animationState, null, 2)}</pre>
			}
		</div>
	);
};

export const CardList: ParentComponent = props => (
	<ul class="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] justify-center justify-items-center gap-x-10 gap-y-4">
		{props.children}
	</ul>
);

type CardFlags = ReturnType<typeof getCardFlags>;
const getCardFlags = (props: CardComponentProps) => ({
	get isFullArt() {
		return props.rarityId === FULL_ART_ID;
	},
	get isLegacy() {
		return props.rarityId === LEGACY_CARD_ID;
	},
	get isSecret() {
		return props.rarityId === NO_CARDS_OPENED_ID;
	},
	get isShitPack() {
		return props.stamps?.includes('shit-pack') || false;
	},
});

const getShitStampImage = (rarityId: string) => {
	if (rarityId.startsWith('bronze')) return ASSETS.STAMPS.SHIT.BRONZE;
	else if (rarityId.startsWith('silver')) return ASSETS.STAMPS.SHIT.SILVER;
	else if (rarityId.startsWith('gold')) return ASSETS.STAMPS.SHIT.GOLD;
	else if (rarityId.startsWith('white')) return ASSETS.STAMPS.SHIT.WHITE;
	else if (rarityId.startsWith('rainbow')) return ASSETS.STAMPS.SHIT.RAINBOW;
	else if (rarityId.startsWith('pink')) return ASSETS.STAMPS.SHIT.PINK;
	else return ASSETS.STAMPS.SHIT.BRONZE;
};

const createImageUrl = (props: CardComponentProps, flags: CardFlags) => () => {
	if (flags.isSecret) return ASSETS.CARDS.CARD_BACK;
	const url = new URL(`https://${import.meta.env.VITE_CARD_CDN_URL}`);
	url.pathname = `/${props.designId}/${props.rarityId}.png`;
	if (props.adminSecret) url.searchParams.set('adminsecret', props.adminSecret);

	return url.toString();
};
