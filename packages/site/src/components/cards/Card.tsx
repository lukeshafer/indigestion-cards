import TiltCardEffect from './TiltCardEffect';
import { FULL_ART_ID } from '@/constants';

interface Props {
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
	const cardName = () => (isFullArt() ? '' : props.cardName);
	const cardDescription = () => (isFullArt() ? '' : props.cardDescription);

	return (
		<div style={{ 'font-size': `calc(1rem * ${props.scale ?? 1})` }}>
			<TiltCardEffect shiny={true}>
				<article
					class="card-wrapper card-aspect-ratio relative w-[18em] bg-cover text-left"
					style={{
						'background-color': props.rarityColor,
						'view-transition-name': `card-${props.instanceId ?? props.designId}`,
					}}>
					<img src={props.imgUrl} alt={props.cardName} class="absolute inset-0" />
					<img src={props.frameUrl} alt="" class="absolute inset-0" />
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
					<p
						class="font-display absolute bottom-[0.5em] right-[1em] text-[0.75em] font-bold italic"
						classList={{
							'text-black': !isFullArt(),
							'text-white': isFullArt(),
						}}>
						{props.cardNumber} / {props.totalOfType}
					</p>
				</article>
			</TiltCardEffect>
		</div>
	);
}
