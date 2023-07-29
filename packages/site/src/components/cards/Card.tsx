import TiltCardEffect from './TiltCardEffect';

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
}

export default function Card(props: Props) {
	return (
		<TiltCardEffect shiny={true}>
			<article
				class="card-wrapper card-aspect-ratio relative w-72 bg-cover text-left"
				style={{ scale: props.scale, 'background-color': props.rarityColor }}>
				<img src={props.imgUrl} alt={props.cardName} class="absolute inset-0" />
				<img src={props.frameUrl} alt="" class="absolute inset-0" />
				<h3
					style={{ left: '12%', width: '76%', top: '4.4%' }}
					class="font-display absolute left-[12%] top-[4.4%] w-[76%] font-bold italic text-slate-900">
					{props.cardName}
				</h3>
				<p
					style={{
						'--left': '11%',
						top: '68.5%',
						height: '15%',
						width: 'calc(100% - var(--left) * 2)',
						left: 'var(--left)',
					}}
					class="card-description absolute p-2 font-sans text-sm font-normal text-black">
					{props.cardDescription}
				</p>
				<p class="font-display absolute bottom-2 right-4 text-xs font-bold italic text-white">
					{props.cardNumber} / {props.totalOfType}
				</p>
			</article>
		</TiltCardEffect>
	);
}
