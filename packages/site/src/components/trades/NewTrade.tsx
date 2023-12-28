import { createStore } from 'solid-js/store';
import type { TradeCard } from '@lil-indigestion-cards/core/db/trades';
import { Suspense, createResource, type JSX, Show, createEffect, on } from 'solid-js';
import { Loading, SubmitButton, TextArea, TextInput } from '../form/Form';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import { USER_API, UNTRADEABLE_RARITY_IDS } from '@/constants';
import { Heading } from '@/components/text';
import { get } from '@/lib/client/data';
import CardSearchList from './CardSearchList';
import OfferWindow from './OfferWindow';
import type { RarityRankingRecord } from '@lil-indigestion-cards/core/lib/site-config';

type TradeState = {
	offeredCards: TradeCard[];
	requestedCards: TradeCard[];
	receiverUsername: string | null;
	form: HTMLFormElement | null;
};

export type TradeCardUi = CardInstance & { checked: boolean };

export default function NewTrade(props: {
	userId: string;
	username: string;
	cardInstances: CardInstance[];
	initialOfferedCards?: CardInstance[];
	initialRequestedCards?: CardInstance[];
	initialReceiverUsername?: string;
	initialReceiverCards?: CardInstance[];
	rarityRanking?: RarityRankingRecord;
}) {
	const [state, setState] = createStore<TradeState>({
		offeredCards: props.initialOfferedCards ?? [],
		requestedCards: props.initialRequestedCards ?? [],
		receiverUsername: props.initialReceiverUsername ?? null,
		form: null,
	});

	const [users] = createResource(async () => get('usernames'));

	createEffect(
		// When receiverUsername changes, reset requestedCards
		on(
			() => state.receiverUsername,
			() => {
				if (!state.receiverUsername) setState('requestedCards', []);
			}
		)
	);

	const [receiverCards] = createResource(
		() => state.receiverUsername,
		receiverUsername =>
			fetch(`${USER_API.CARD}?username=${receiverUsername}`, {
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			}).then(res => res.json() as Promise<CardInstance[]>),
		{
			initialValue: props.initialReceiverCards ?? [],
			ssrLoadFrom: 'initial',
		}
	);

	const receiverCardsUi = () =>
		receiverCards()
			.map(card => ({
				...card,
				get checked() {
					return state.requestedCards.some(
						requested => requested.instanceId === card.instanceId
					);
				},
			}))
			.filter(
				card => card.openedAt && !UNTRADEABLE_RARITY_IDS.includes(card.rarityId)
			) satisfies TradeCardUi[];

	const yourCards = () =>
		props.cardInstances
			.map(card => ({
				...card,
				get checked() {
					return state.offeredCards.some(
						offered => offered.instanceId === card.instanceId
					);
				},
			}))
			.filter(
				card => card.openedAt && !UNTRADEABLE_RARITY_IDS.includes(card.rarityId)
			) satisfies TradeCardUi[];

	updateUrlFromState(state);

	return (
		<>
			<form class="sr-only" id="reset-form"></form>
			<form
				method="post"
				ref={el => setState('form', el)}
				class="mx-auto max-w-7xl"
				enctype="application/x-www-form-urlencoded">
				<div class="@4xl/main:grid-cols-2 grid w-full grid-cols-1">
					<Section heading="Offer">
						<input type="hidden" name="senderUsername" value={props.username} />
						<Username>{props.username}</Username>
						<OfferWindow
							cards={state.offeredCards}
							setCards={setter => setState('offeredCards', setter)}
						/>
						<CardSearchList
							type="offer"
							label="Your Cards"
							cards={yourCards()}
							setCards={setter => setState('offeredCards', setter)}
							rarityRanking={props.rarityRanking}
						/>
					</Section>
					<Section heading="Request">
						<Username>
							{state.receiverUsername === null ? (
								<div>
									<TextInput
										inputOnly
										name="receiverUsername"
										label="Search for User"
										onInvalid={e =>
											e.currentTarget.setCustomValidity(
												'Please select a user'
											)
										}
										required
										list="usernames"
										onChange={e => {
											if (
												users()?.includes(e.target.value) &&
												e.target.value !== props.username
											)
												setState('receiverUsername', e.target.value);
										}}
									/>
									<button
										type="submit"
										class="sr-only"
										formMethod="get"
										onClick={e => {
											e.preventDefault();
											const input = e.target
												.previousSibling as HTMLInputElement;
											if (
												users()?.includes(input.value) &&
												input.value !== props.username
											)
												setState('receiverUsername', input.value);
										}}>
										Submit
									</button>
								</div>
							) : (
								<>
									<input
										type="hidden"
										name="receiverUsername"
										value={state.receiverUsername}
									/>
									{state.receiverUsername}
									<button
										class="px-4 text-red-500"
										type="submit"
										form="reset-form"
										onClick={() => {
											setState('receiverUsername', null);
										}}>
										X
									</button>
								</>
							)}
						</Username>
						<OfferWindow
							cards={state.requestedCards}
							setCards={setter => setState('requestedCards', setter)}
						/>
						<Show when={state.receiverUsername !== null}>
							<Suspense
								fallback={
									<div class="relative">
										<Loading />
									</div>
								}>
								<CardSearchList
									type="request"
									label={`${state.receiverUsername}'s cards`}
									cards={receiverCardsUi() ?? []}
									setCards={setter => setState('requestedCards', setter)}
								/>
							</Suspense>
						</Show>
					</Section>
					<div class="col-span-full grid grid-cols-[minmax(auto,30rem)] flex-col justify-center justify-items-start gap-2">
						<TextArea
							name="message"
							maxLength="140"
							label="Message"
							placeholder="Write a message to the other user"
						/>
						<SubmitButton />
					</div>
				</div>
			</form>
		</>
	);
}

const updateUrlFromState = (state: TradeState) => {
	createEffect(
		on(
			[
				() => state.offeredCards.length,
				() => state.requestedCards.length,
				() => state.receiverUsername,
			],
			() => {
				//console.log('updating url');
				const form = state.form;
				if (!form) return;
				const formData = new FormData(form);
				// @ts-expect-error - there are no files in this form
				const params = new URLSearchParams([...formData.entries()]);
				params.delete('search');
				if (!params.get('receiverUsername')) params.delete('receiverUsername');

				const url = new URL(window.location.href);
				url.search = params.toString();

				window.history.replaceState({}, '', url.toString());
			}
		)
	);
};

function Section(props: { heading: string; children: JSX.Element }) {
	return (
		<section class="w-full">
			<Heading classList={{ 'text-center': true }}>{props.heading}</Heading>
			{props.children}
		</section>
	);
}

function Username(props: { children: JSX.Element }) {
	return (
		<div class="flex h-12 items-end justify-center text-center text-xl font-semibold">
			{props.children}
		</div>
	);
}
