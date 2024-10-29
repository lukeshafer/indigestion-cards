import type { TradeCard, TradePack } from '@core/types';
import { For, Show, type Component } from 'solid-js';
import Card from '../cards/Card';
import { produce } from 'solid-js/store';
import { routes } from '@site/constants';
import { PackListItem } from './PackTradeList';

export default function OfferWindow(props: {
	cards: TradeCard[];
	packs: TradePack[];
	setCards?: (setter: (cards: TradeCard[]) => TradeCard[]) => void;
	setPacks?: (setter: (cards: TradePack[]) => TradePack[]) => void;
}) {
	return (
		<ul class="scrollbar-narrow m-4 flex h-[30rem] flex-wrap items-center justify-center gap-2 overflow-y-scroll bg-gray-200 p-2 dark:bg-gray-700">
			<For each={props.cards}>
				{card => (
					<li
						class="relative"
						style={{ 'view-transition-name': 'offer-window-card-' + card.instanceId }}>
						<a href={`${routes.INSTANCES}/${card.designId}/${card.instanceId}`}>
							<Card {...card} />
						</a>
						<Show when={props.setCards}>
							<DeleteItemButton
								title="Remove Card"
								onClick={() => {
									props.setCards?.(
										produce(draft => {
											let index = draft.findIndex(
												c => c.instanceId === card.instanceId
											);
											while (index !== -1) {
												draft.splice(index, 1);
												index = draft.findIndex(
													c => c.instanceId === card.instanceId
												);
											}
										})
									);
								}}
							/>
						</Show>
					</li>
				)}
			</For>
			<For each={props.packs}>
				{pack => (
					<li
						class="relative"
						style={{ 'view-transition-name': 'offer-window-pack-' + pack.packId }}>
						<PackListItem pack={pack} />
						<Show when={props.setPacks}>
							<DeleteItemButton
								title="Remove Card"
								onClick={() => {
									props.setPacks?.(
										produce(draft => {
											let index = draft.findIndex(
												p => p.packId === pack.packId
											);
											while (index !== -1) {
												draft.splice(index, 1);
												index = draft.findIndex(
													p => p.packId === pack.packId
												);
											}
										})
									);
								}}
							/>
						</Show>
					</li>
				)}
			</For>
		</ul>
	);
}

const DeleteItemButton: Component<{
	title: string;
	onClick: () => void;
}> = props => (
	<button
		title="Remove Card"
		class="absolute left-2 top-2 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white p-1 font-black text-red-600 hover:brightness-75"
		onClick={() => props.onClick()}>
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
);
