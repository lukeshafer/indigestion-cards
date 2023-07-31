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
	scale?: number;
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
		<TiltCardEffect shiny={true}>
			<article
				class="card-wrapper card-aspect-ratio relative w-72 bg-cover text-left"
				style={{ scale: props.scale, 'background-color': props.rarityColor }}>
				<img src={props.imgUrl} alt={props.cardName} class="absolute inset-0" />
				<img src={props.frameUrl} alt="" class="absolute inset-0" />
				<h3 class="font-display absolute left-[12%] top-[4.9%] w-[66%] text-[0.9rem] font-bold italic text-slate-900">
					{cardName()}
				</h3>
				<p
					style={{
						'--left': '11%',
						top: '68.5%',
						height: '15%',
						width: 'calc(100% - var(--left) * 2)',
						left: 'var(--left)',
					}}
					class="card-description font-heading absolute p-2 text-sm font-normal text-black">
					{cardDescription()}
				</p>
				<p
					class="font-display absolute bottom-2 right-4 text-xs font-bold italic"
					classList={{
						'text-black': !isFullArt(),
						'text-white': isFullArt(),
					}}>
					{props.cardNumber} / {props.totalOfType}
				</p>
			</article>
		</TiltCardEffect>
	);
}
