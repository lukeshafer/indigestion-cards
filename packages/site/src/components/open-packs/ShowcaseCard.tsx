import { createSignal, Show, useContext, type Component } from 'solid-js';
import { OpenPacksContext, type PackEntityWithStatus } from './OpenPacksContext';
import { API, ASSETS } from '@site/constants';
import {
	Card,
	CardDescription,
	CardName,
	CardNumber,
  CardPreview,
	checkIfCanShowCardText,
	checkIsFullArt,
	checkIsLegacyCard,
	checkIsShitPack,
	formatCardNumber,
	FULL_ART_BACKGROUND_CSS,
	FullAnimatedCardEffect,
	getCardImageUrl,
	getShitStampPath,
	ShitStamp,
	TiltEffectWrapper,
} from '../Card';

export function ShowcaseCard(props: {
	card: PackEntityWithStatus['cardDetails'][number];
	packId: PackEntityWithStatus['packId'];
}) {
	const state = useContext(OpenPacksContext);

	// eslint-disable-next-line solid/reactivity
	const [flipped, setFlipped] = createSignal(props.card.opened);
	const isPreviewed = () => state.previewedCardId === props.card.instanceId;

	const flipCard = async () => {
		setFlipped(true);
		state.flipCard(props.card.instanceId);

		const body = new URLSearchParams({
			instanceId: props.card.instanceId,
			designId: props.card.designId,
			packId: props.packId,
		}).toString();

		if (state.isTesting) {
			console.log('Card flipped: ', body);
		} else {
			await fetch(API.OPEN_CARD, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body,
			});
		}
	};

	const previewCard = () => {
		if (!flipped()) return;
		state.setPreviewedCardId(props.card.instanceId);
		state.removeNewStampStamp(props.card.instanceId);
	};

	const closePreview = () => {
		state.setPreviewedCardId('');
	};

	return (
		<li>
			<p class="error-text" />
			<div
				classList={{ flipped: flipped() }}
				style={{ width: state.cardScale * 18 + 'rem' }}
				class="perspective preserve-3d card-aspect-ratio relative block w-72 origin-center transition-transform duration-500">
				<button
					onClick={flipCard}
					class="backface-hidden absolute inset-0 h-full w-full cursor-pointer"
					title="Click to reveal">
					<div style={{ scale: 1 }} class="origin-top-left">
						<TiltEffectWrapper>
							<Card
								scale={state.cardScale}
								alt=""
								viewTransitionName={undefined}
								background={undefined}
								lazy={false}
								imgSrc={ASSETS.CARDS.CARD_BACK}
							/>
							<img />
						</TiltEffectWrapper>
					</div>
				</button>
				<div class="backface-hidden flipped absolute inset-0 h-full w-full">
					<button class="block origin-top-left" onClick={previewCard}>
						{isPreviewed() ? (
							<CardPreview close={closePreview}>
								<ShowcaseCardLayout
									card={props.card}
									scale={state.cardScale * 1.5}
									adminSecret={state.adminSecret}
								/>
							</CardPreview>
						) : (
							<ShowcaseCardLayout
								card={props.card}
								scale={state.cardScale}
								adminSecret={state.adminSecret}
							/>
						)}
					</button>
				</div>
			</div>
		</li>
	);
}

const ShowcaseCardLayout: Component<{
	card: PackEntityWithStatus['cardDetails'][number];
	scale: number;
	adminSecret: string;
}> = props => {
	return (
		<FullAnimatedCardEffect
			glowColor={checkIsFullArt(props.card.rarityId) ? undefined : props.card.rarityColor}>
			<Card
				scale={props.scale}
				alt={props.card.cardName}
				lazy={false}
				viewTransitionName={`card-${props.card.instanceId}`}
				background={
					checkIsFullArt(props.card.rarityId)
						? FULL_ART_BACKGROUND_CSS
						: props.card.rarityColor
				}
				imgSrc={getCardImageUrl({
					adminSecret: props.adminSecret,
					designId: props.card.designId,
					rarityId: props.card.rarityId,
				})}>
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
					<Show when={!checkIsLegacyCard(props.card.rarityId)}>
						<CardNumber color={checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
							{formatCardNumber(props.card)}
						</CardNumber>
					</Show>
					<Show when={checkIsShitPack(props.card.stamps)}>
						<ShitStamp
							src={getShitStampPath(props.card.rarityId)}
							animation={props.card.stamps?.includes('new-stamp') ? 'slam' : 'none'}
						/>
					</Show>
				</Show>
			</Card>
		</FullAnimatedCardEffect>
	);
};
