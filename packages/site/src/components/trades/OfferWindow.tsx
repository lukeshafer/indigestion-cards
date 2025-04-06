import type { TradeCard, TradePack } from '@core/types';
import { For, Show, type Component } from 'solid-js';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '../Card';
import { produce } from 'solid-js/store';
import { INVALID_PACK_ID, routes } from '@site/constants';
import { transformPackTypeName } from '@site/client/utils';
import { Pack, formatPackNumber } from '@site/components/Pack';

type OfferPack = TradePack & { packNumber?: number; packNumberPrefix?: string };

export default function OfferWindow(props: {
	cards: TradeCard[];
	packs: OfferPack[];
	setCards?: (setter: (cards: TradeCard[]) => TradeCard[]) => void;
	setPacks?: (setter: (cards: OfferPack[]) => OfferPack[]) => void;
}) {
	return (
		<ul class="scrollbar-narrow m-4 flex h-[30rem] flex-wrap items-center justify-center gap-2 overflow-y-scroll bg-gray-200 p-2 dark:bg-gray-700">
			<For each={props.cards}>
				{card => (
					<li
						class="relative"
						style={{ 'view-transition-name': 'offer-window-card-' + card.instanceId }}>
						<OfferWindowCard card={card} />
						<Show when={props.setCards}>
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
						</Show>
					</li>
				)}
			</For>
			<For each={props.packs}>
				{pack => (
					<li
						class="relative"
						style={{ 'view-transition-name': 'offer-window-pack-' + pack.packId }}>
						<Show
							when={pack.packTypeId !== INVALID_PACK_ID}
							fallback={'The pack has been opened.'}>
							<Pack
								name={transformPackTypeName(pack.packTypeName)}
								packNumber={formatPackNumber(pack)}
							/>
						</Show>
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
	<a href={`${routes.INSTANCES}/${props.card.designId}/${props.card.instanceId}`} class="group">
		<CardEls.TiltEffectWrapper angleMultiplier={0.5}>
			<CardEls.GlowOnHover color={props.card.rarityColor} />
			<CardEls.Card
				lazy={false}
				alt={props.card.cardName}
				imgSrc={cardUtils.getCardImageUrl(props.card)}
				viewTransitionName={`card-${props.card.instanceId}`}
				background={
					cardUtils.checkIsFullArt(props.card.rarityId)
						? FULL_ART_BACKGROUND_CSS
						: props.card.rarityColor
				}>
				<Show when={cardUtils.checkIfCanShowCardText(props.card.rarityId)}>
					<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
					<CardEls.CardDescription>{props.card.cardDescription}</CardEls.CardDescription>
				</Show>
				<Show when={!cardUtils.checkIsLegacyCard(props.card.rarityId)}>
					<CardEls.CardNumber
						color={cardUtils.checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
						{cardUtils.formatCardNumber(props.card)}
					</CardEls.CardNumber>
				</Show>
				<Show when={cardUtils.checkIsShitPack(props.card.stamps)}>
					<CardEls.ShitStamp src={cardUtils.getShitStampPath(props.card.rarityId)} />
				</Show>
			</CardEls.Card>
			<CardEls.ShineMouseEffect />
		</CardEls.TiltEffectWrapper>
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
