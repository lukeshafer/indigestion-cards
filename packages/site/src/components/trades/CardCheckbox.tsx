import type { TradeCard } from '@core/types';
import type { TradeCardUi } from './NewTrade';
import Card from '../cards/Card';

export default function CardCheckbox(props: {
	card: TradeCardUi;
	addCard: () => void;
	removeCard: () => void;
	type: 'offer' | 'request';
}) {
	return (
		<li
			class="m-1 p-2"
			classList={{
				'outline outline-4 outline-brand-main bg-gray-200 dark:bg-gray-800 opacity-90': props.card.checked,
			}}>
			<label class="relative cursor-pointer text-center">
				<input
					class="absolute opacity-0 checked:left-4 checked:top-4 checked:z-50 checked:opacity-100"
					name={`${props.type}edCards`}
					value={props.card.instanceId}
					checked={props.card.checked}
					type="checkbox"
					onInput={(e) => {
						if (e.currentTarget.checked) {
							props.addCard();
						} else {
							props.removeCard();
						}
					}}
				/>
				<MiniCard card={props.card} />
			</label>
		</li>
	);
}

function MiniCard(props: { card: TradeCard }) {
	return (
		<div class="text-center flex flex-col items-center w-40">
			<Card {...props.card} scale={0.5} />
			<p class="font-bold whitespace-break-spaces">
        {props.card.cardName}
      </p>
			<p>{props.card.rarityName}</p>
			<p>
				{props.card.cardNumber} / {props.card.totalOfType}
			</p>
		</div>
	);
}
