import TiltCardEffect from './TiltCardEffect';
import { ASSETS, FULL_ART_ID, LEGACY_CARD_ID, NO_CARDS_OPENED_ID } from '@/constants';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import { css } from '@acab/ecsstatic';

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
}

const stampAnimationStyles = css`
	animation: stamp 500ms cubic-bezier(0.44, 1.34, 0.37, 0.99) forwards;
	transform-origin: center;
`;

export default function Card(props: Props) {
	const isFullArt = () => props.rarityId === FULL_ART_ID;
	const isLegacy = () => props.rarityId === LEGACY_CARD_ID;
	const isSecret = () => props.rarityId === NO_CARDS_OPENED_ID;
	const cardName = () => (isFullArt() || isLegacy() ? '' : isSecret() ? '?????' : props.cardName);
	const cardDescription = () =>
		isFullArt() || isLegacy()
			? ''
			: isSecret()
				? randomDescription()
				: props.cardDescription;
	const frameUrl = () => (isSecret() ? ASSETS.CARDS.DEFAULT_BASE_RARITY : props.frameUrl);
	const imgUrl = () => (isSecret() ? ASSETS.CARDS.HIDDEN_CARD : props.imgUrl);

	const isShitPack = () => props.stamps?.includes('shit-pack');

	return (
		<div style={{ 'font-size': `calc(1rem * ${props.scale ?? 1})` }}>
			<TiltCardEffect shiny={!isSecret()}>
				<article
					class="card-wrapper card-aspect-ratio relative w-[18em] bg-cover text-left"
					classList={{ 'grayscale blur-sm': isSecret() }}
					style={{
						'background-color': props.rarityColor,
						'view-transition-name': `card-${props.instanceId ?? props.designId}`,
					}}>
					<img
						src={imgUrl()}
						alt={props.cardName}
						class="absolute inset-0"
						classList={{ 'blur contrast-50': isSecret() }}
					/>
					{isSecret() && (
						<p class="absolute top-[10%] w-full text-center text-[10em] font-extrabold text-gray-600">
							?
						</p>
					)}
					<img src={frameUrl()} alt="" class="absolute inset-0" />
					<h3 class="font-display absolute left-[12%] top-[4.9%] w-[66%] text-[0.9em] font-bold italic text-slate-900">
						{cardName()}
					</h3>
					<p
						style={{
							'--left': '11.5%',
							top: '69.420%',
							width: 'calc(100% - var(--left) * 2)',
							left: 'var(--left)',
						}}
						class="card-description font-heading absolute p-[0.5em] text-[0.85em] font-medium leading-[1.30em] text-black">
						{cardDescription()}
					</p>
					{!isLegacy() && (
						<p
							class="font-display absolute bottom-[0.5em] right-[1em] text-[0.75em] font-bold italic"
							classList={{
								'text-black': !isFullArt(),
								'text-white': isFullArt(),
							}}>
							{props.cardNumber} / {props.totalOfType}
						</p>
					)}
					{isShitPack() && (
						<div class="absolute left-[52%] top-1/2 block w-[15em] -translate-x-1/2 -translate-y-1/2 rotate-12">
							<img
								src={ASSETS.CARDS.SHIT_PACK}
								classList={{
									[stampAnimationStyles]: props.stamps?.includes('new-stamp'),
									'opacity-80': !props.stamps?.includes('new-stamp'),
								}}
								width="350"
							/>
						</div>
					)}
				</article>
			</TiltCardEffect>
		</div>
	);
}

function randomDescription() {
	const len = Math.ceil(Math.random() * 70 + 50);

	let str = "";
	for (let i = 0; i < len; i++) {
		const value = Math.random();
		const char =
			value < 0.1 ? 'i'
			: value < 0.2 ? 'O'
			: value < 0.3 ? 'e'
			: value < 0.4 ? 'A'
			: value < 0.5 ? '?' 
			: ' '
		str = str + char
	}

	return str
}

