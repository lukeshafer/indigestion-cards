import type { TradeCard } from '@lil-indigestion-cards/core/db/trades';
import { For } from 'solid-js';
import Card from '../cards/Card';
import { produce } from 'solid-js/store';

export default function OfferWindow(props: {
	cards: TradeCard[];
	setCards: (setter: (cards: TradeCard[]) => TradeCard[]) => void;
	type: 'offer' | 'request';
}) {
	return (
		<ul class="scrollbar-narrow m-4 flex h-[30rem] flex-wrap items-center justify-center gap-2 overflow-y-scroll bg-gray-300 p-2 dark:bg-gray-700">
			<For each={props.cards}>
				{(card) => (
					<li
						class="relative"
						style={{ 'view-transition-name': 'offer-window-card-' + card.instanceId }}>
						<Card {...card} />
						<button
							title="Remove Card"
							class="absolute left-2 top-2 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white p-1 font-black text-red-600 hover:brightness-75"
							onClick={() => {
								props.setCards(
									produce((draft) => {
										let index = draft.findIndex(
											(c) => c.instanceId === card.instanceId
										);
										while (index !== -1) {
											draft.splice(index, 1);
											index = draft.findIndex(
												(c) => c.instanceId === card.instanceId
											);
										}
									})
								);
							}}>
							<span aria-hidden="true">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="100%"
									height="100%"
									viewBox="0 0 1024 1024">
									<path
										fill="currentColor"
										d="M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504L738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512L828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496L285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512L195.2 285.696a64 64 0 0 1 0-90.496z"
									/>
								</svg>
							</span>
							<span class="sr-only">Remove Card</span>
						</button>
					</li>
				)}
			</For>
		</ul>
	);
}
