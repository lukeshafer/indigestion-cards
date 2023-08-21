import TiltCardEffect from './TiltCardEffect';
import { FULL_ART_ID, LEGACY_CARD_ID, NO_CARDS_OPENED_ID } from '@/constants';
import type { CardInstanceEntity } from '@lil-indigestion-cards/core/card';
import styles from './Card.module.css';

interface Props extends Partial<CardInstanceEntity> {
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

export default function Card(props: Props) {
	const isFullArt = () => props.rarityId === FULL_ART_ID;
	const isLegacy = () => props.rarityId === LEGACY_CARD_ID;
	const isSecret = () => props.rarityId === NO_CARDS_OPENED_ID;
	const cardName = () => (isFullArt() || isLegacy() ? '' : isSecret() ? '?????' : props.cardName);
	const cardDescription = () =>
		isFullArt() || isLegacy()
			? ''
			: isSecret()
			? '????? ??????????????? ?? ?? ? ?????? ??????'
			: props.cardDescription;
	const frameUrl = () => (isSecret() ? '/default-base-rarity.png' : props.frameUrl);
	const imgUrl = () => (isSecret() ? '/hiddencard.png' : props.imgUrl);

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
					<img src={imgUrl()} alt={props.cardName} class="absolute inset-0" 
						classList={{ 'blur contrast-50': isSecret() }}
					/>
					{isSecret() && (
						<p class="absolute top-[10%] w-full text-center text-[10em] font-extrabold text-gray-600">
							?
						</p>
					)}
					<img
						src={frameUrl()}
						alt=""
						class="absolute inset-0"
					/>
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
								src="/shit_pack_brown.png"
								classList={{
									[styles.animateStamp]: props.stamps?.includes('new-stamp'),
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
