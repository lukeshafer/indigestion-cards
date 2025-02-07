import type { TradeCard, TradePack } from '@core/types';
import { For, Show, type Component } from 'solid-js';
import {
	Card,
	CardDescription,
	CardName,
	CardNumber,
	checkIfCanShowCardText,
	checkIsFullArt,
	checkIsLegacyCard,
	checkIsShitPack,
	formatCardNumber,
	FULL_ART_BACKGROUND_CSS,
	getCardImageUrl,
	getShitStampPath,
	GlowOnHover,
	ShineMouseEffect,
	ShitStamp,
	TiltEffectWrapper,
} from '../Card';
import { produce } from 'solid-js/store';
import { routes } from '@site/constants';
import { transformPackTypeName } from '@site/lib/client/utils';
import { Pack } from '@site/components/Pack';

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
						<OfferWindowCard card={card} />
						<DeleteItemButton
							title="Remove Card"
							onClick={() =>
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
								)
							}
						/>
					</li>
				)}
			</For>
			<For each={props.packs}>
				{pack => (
					<li
						class="relative"
						style={{ 'view-transition-name': 'offer-window-pack-' + pack.packId }}>
						<Pack name={transformPackTypeName(pack.packTypeName)} />
						<Show when={props.setPacks}>
							<DeleteItemButton
								title="Remove Pack"
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

const OfferWindowCard: Component<{ card: TradeCard }> = props => (
		<a
			href={`${routes.INSTANCES}/${props.card.designId}/${props.card.instanceId}`}
			class="group">
			<TiltEffectWrapper angleMultiplier={0.5}>
				<GlowOnHover color={props.card.rarityColor} />
				<Card
					lazy={false}
					alt={props.card.cardName}
					imgSrc={getCardImageUrl(props.card)}
					viewTransitionName={`card-${props.card.instanceId}`}
					background={
						checkIsFullArt(props.card.rarityId)
							? FULL_ART_BACKGROUND_CSS
							: props.card.rarityColor
					}>
					<Show when={checkIfCanShowCardText(props.card.rarityId)}>
						<CardName>{props.card.cardName}</CardName>
						<CardDescription>{props.card.cardDescription}</CardDescription>
					</Show>
					<Show when={!checkIsLegacyCard(props.card.rarityId)}>
						<CardNumber color={checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
							{formatCardNumber(props.card)}
						</CardNumber>
					</Show>
					<Show when={checkIsShitPack(props.card.stamps)}>
						<ShitStamp src={getShitStampPath(props.card.rarityId)} />
					</Show>
				</Card>
				<ShineMouseEffect />
			</TiltEffectWrapper>
		</a>
);
const DeleteItemButton: Component<{
	title: string;
	onClick: () => void;
}> = props => (
	<button
		title={props.title}
		class="bg-brand-dark border-brand-950 absolute left-2 top-2 z-50 flex h-5 w-5 items-center justify-center rounded border-2 p-px font-black text-white opacity-75 hover:opacity-100"
		onClick={e => {
			e.preventDefault();
			props.onClick();
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
		<span class="sr-only">{props.title}</span>
	</button>
);
