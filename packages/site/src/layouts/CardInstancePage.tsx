import { createEffect, createSignal, Match, Show, Switch, For, type Component } from 'solid-js';
import { Anchor, Heading, PageTitle } from '@site/components/text';
import type { CardDesign, CardInstance, User } from '@core/types';
import { CardEls, CardPreview, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';
import { useViewTransition } from '@site/client/utils';
import { routes,  } from '@site/constants';
import { createTable, TableEls } from '@site/components/Table';
import {  SubmitButton } from '@site/components/Form';
import { trpc } from '@site/client/api';
import { pushAlert } from '@site/client/state';

export const CardInstancePage: Component<{
	card: CardInstance;
	design: CardDesign;
	user?: User;
	isTradeable: boolean;
}> = props => {
	const isPinned = () => props.user?.pinnedCard?.instanceId === props.card.instanceId;
	const isOwnedByLoggedInUser = () =>
		props.user?.userId === props.card.userId && props.user?.userId;
  console.log(props.user)

	return (
		<>
			<header class="flex flex-col items-center gap-4">
				<PageTitle>
					{props.card.cardName}, {props.card.rarityName} #{props.card.cardNumber}
				</PageTitle>
				<div class="mx-4">
					<PreviewableCard card={props.card} />
				</div>
			</header>
			<Switch>
				<Match when={isOwnedByLoggedInUser()}>
					{userId => (
						<div class="mx-auto">
							<PinCardToProfileButton
								userId={userId()}
								instanceId={props.card.instanceId}
								designId={props.card.designId}
								isPinned={isPinned()}
							/>
						</div>
					)}
				</Match>
				<Match when={props.user && !isOwnedByLoggedInUser() && props.isTradeable}>
					<div class="mx-auto">
						<Anchor
							href={`${routes.TRADES}/new?receiverUsername=${props.card.username}&requestedCards=${props.card.instanceId}`}>
							Request Trade
						</Anchor>
					</div>
				</Match>
			</Switch>

			<CardInstanceInfo card={props.card} design={props.design} />
			<Show when={props.card.tradeHistory}>
				{tradeHistory => <CardTradeHistory history={tradeHistory()} />}
			</Show>
		</>
	);
};

const PreviewableCard: Component<{ card: CardInstance }> = props => {
	const [isPreviewed, setIsPreviewed] = createSignal(false);

	createEffect(() => {
		if (isPreviewed()) {
			document.body.style.setProperty('overflow', 'hidden');
			document.getElementById('page-scroll-wrapper')?.style.setProperty('overflow', 'hidden');
		} else {
			document.body.style.removeProperty('overflow');
			document.getElementById('page-scroll-wrapper')?.style.removeProperty('overflow');
		}
	});

	const cardElement = (
		<CardEls.TiltEffectWrapper angleMultiplier={isPreviewed() ? 2 : 1}>
			<CardEls.Card
				scale={isPreviewed() ? 1.6 : 1.2}
				lazy={false}
				alt={props.card.cardName}
				imgSrc={cardUtils.getCardImageUrl(props.card)}
				background={
					cardUtils.checkIsFullArt(props.card.rarityId)
						? FULL_ART_BACKGROUND_CSS
						: props.card.rarityColor
				}
				viewTransitionName={`card-${props.card.instanceId}`}>
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

const CardInstanceInfo: Component<{ card: CardInstance; design: CardDesign }> = props => {
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
				<b>Artist: </b>
				{props.design.artist}
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

const CardTradeHistory: Component<{
	history: NonNullable<CardInstance['tradeHistory']>;
}> = props => {
	const table = createTable(
		() => ({
			date: 'date',
			from: 'text',
			to: 'text',
			actions: 'text',
			tradeId: 'text',
		}),
		() =>
			props.history.map(history => ({
				date: history.completedAt,
				from: history.fromUsername,
				to: history.toUsername,
				actions: '',
				tradeId: history.tradeId,
			}))
	);
	return (
		<article>
			<Heading>Trade History</Heading>
			<TableEls.Table>
				<TableEls.THead>
					<TableEls.THeading table={table} name="date">
						Date
					</TableEls.THeading>
					<TableEls.THeading table={table} name="from">
						From
					</TableEls.THeading>
					<TableEls.THeading table={table} name="to">
						To
					</TableEls.THeading>
					<TableEls.THeading table={table} name="actions" />
				</TableEls.THead>
				<TableEls.TBody>
					<For each={table.rows}>
						{row => (
							<TableEls.TRow>
								<TableEls.TCell>
									{new Date(row.date).toLocaleDateString()}
								</TableEls.TCell>
								<TableEls.TCell font="title">
									<a
										href={`${routes.USERS}/${row.from}`}
										class="hover:underline focus:underline">
										{row.from}
									</a>
								</TableEls.TCell>
								<TableEls.TCell font="title">
									<a
										href={`${routes.USERS}/${row.to}`}
										class="hover:underline focus:underline">
										{row.to}
									</a>
								</TableEls.TCell>
								<TableEls.TCell>
									<Anchor href={`${routes.TRADES}/${row.tradeId}`}>
										View Trade
									</Anchor>
								</TableEls.TCell>
							</TableEls.TRow>
						)}
					</For>
				</TableEls.TBody>
			</TableEls.Table>
		</article>
	);
};

const PinCardToProfileButton: Component<{
	userId: string;
	instanceId: string;
	designId: string;
	isPinned?: boolean;
}> = props => {
	const [isPinnedUI, setIsPinnedUI] = createSignal(undefined as boolean | undefined);
	const isPinned = () => isPinnedUI() ?? props.isPinned;
	const text = () => (isPinned() ? 'Unpin from profile' : 'Pin to profile');

	return (
		<form
			onSubmit={async e => {
				e.preventDefault();
				await trpc.users.update
					.mutate({
						pinnedCardId: props.isPinned ? null : props.instanceId,
						pinnedCardDesignId: props.isPinned ? null : props.designId,
					})
					.catch(() => {
						pushAlert({
							message: 'An error occurred while pinning the card.',
							type: 'error',
						});
					});

				setIsPinnedUI(!isPinned());
				pushAlert({
					message: 'Updated.',
					type: 'success',
				});
			}}>
			<SubmitButton>{text()}</SubmitButton>
		</form>
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
