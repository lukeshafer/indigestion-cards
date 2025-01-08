import { createEffect, createSignal, Show, type Component } from 'solid-js';
import { Heading } from '@site/components/text';
import type { CardInstance } from '@core/types';
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
	ShineMouseEffect,
	ShitStamp,
	TiltEffectWrapper,
} from './Card';
import CardPreview from './CardPreview';
import { useViewTransition } from '@site/lib/client/utils';
import { routes } from '@site/constants';

export const PreviewableCard: Component<{ card: CardInstance }> = props => {
	const [isPreviewed, setIsPreviewed] = createSignal(false);

	createEffect(() => {
		if (isPreviewed()) {
			document.body.style.setProperty('overflow', 'hidden');
			document
				.getElementById('page-scroll-wrapper')
				?.style.setProperty('overflow', 'hidden');
		} else {
			document.body.style.removeProperty('overflow');
			document.getElementById('page-scroll-wrapper')?.style.removeProperty('overflow');
		}
	});

	const cardElement = (
		<TiltEffectWrapper angleMultiplier={isPreviewed() ? 2 : 1}>
			<Card
				scale={isPreviewed() ? 1.6 : 1.2}
				lazy={false}
				alt={props.card.cardName}
				imgSrc={getCardImageUrl(props.card)}
				background={
					checkIsFullArt(props.card.rarityId)
						? FULL_ART_BACKGROUND_CSS
						: props.card.rarityColor
				}
				viewTransitionName={`card-${props.card.instanceId}`}>
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
	);

	return (
		<button
			class="block origin-top-left"
			onClick={() => useViewTransition(() => setIsPreviewed(true))}
			title="Click to enlarge">
			<Show when={isPreviewed()} fallback={cardElement}>
				<CardPreview close={() => setIsPreviewed(false)}>{cardElement}</CardPreview>
			</Show>
		</button>
	);
};

export const CardInstanceInfo: Component<{ card: CardInstance }> = props => {
	const openDate = () => formatOpenDateString(props.card.openedAt);

	return (
		<section class="mx-auto text-lg">
			<Heading>Stats:</Heading>
			<p>
				<b>Rarity: </b>
				{props.card.rarityName}
			</p>
			<p>
				<b>Card: </b>
				<a class="underline" href={`${routes.CARDS}/${props.card.designId}`}>
					{props.card.cardName}
				</a>
			</p>
			<p>
				<b>Card Number: </b>
				{props.card.cardNumber}
			</p>
			<p>
				<b>Season: {props.card.seasonName}</b>
			</p>
			<p>
				<b>Owner: </b>
				{props.card.username ? (
					<a class="underline" href={`${routes.USERS}/${props.card.username}`}>
						{props.card.username}
					</a>
				) : (
					'None'
				)}
			</p>
			<p>
				<b>Minter: </b>
				{props.card.minterUsername ? (
					<a class="underline" href={`${routes.USERS}/${props.card.minterUsername}`}>
						{props.card.minterUsername}
					</a>
				) : (
					'None'
				)}
			</p>
			<p>
				<b>Opened at: </b>
				{props.card.openedAt ? (
					<time datetime={openDate()}>{openDate()}</time>
				) : (
					'Not opened yet'
				)}
			</p>
		</section>
	);
};

function formatOpenDateString(openedAt: string | undefined) {
	if (openedAt) {
		return new Date(openedAt).toLocaleString('en-US', {
			timeZone: 'America/New_York',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			timeZoneName: 'short',
		});
	} else return 'Not opened yet';
}
