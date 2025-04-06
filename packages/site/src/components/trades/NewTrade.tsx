import { createStore } from 'solid-js/store';
import type { TradeCard, CardInstance, PackCardsHidden, TradePack } from '@core/types';
import { Suspense, createResource, type JSX, Show, createEffect, on, createSignal } from 'solid-js';
import { Loading, SubmitButton, TextArea, TextInput } from '../Form';
import { UNTRADEABLE_RARITY_IDS, routes } from '@site/constants';
import { Heading } from '@site/components/text';
import CardSearchList from './CardSearchList';
import OfferWindow from './OfferWindow';
import type { RarityRankingRecord } from '@core/lib/site-config';
import { trpc } from '@site/client/api';
import PackTradeList from './PackTradeList';
import { TRPCClientError } from '@trpc/client';

type TradeState = {
	offeredCards: TradeCard[];
	requestedCards: TradeCard[];
	offeredPacks: TradePack[];
	requestedPacks: TradePack[];
	receiverUsername: string | null;
	form: HTMLFormElement | null;
	formDataParams: URLSearchParams | undefined;
};

export type TradeCardUi = CardInstance & { checked: boolean };
export type TradePackUi = PackCardsHidden & { checked: boolean };

export default function NewTrade(props: {
	userId: string;
	username: string;
	cardInstances: CardInstance[];
	packs: PackCardsHidden[];
	initialOfferedCards?: CardInstance[];
	initialOfferedPacks?: PackCardsHidden[];
	initialRequestedCards?: CardInstance[];
	initialRequestedPacks?: PackCardsHidden[];
	initialReceiverUsername?: string;
	initialReceiverCards?: CardInstance[];
	initialReceiverPacks?: PackCardsHidden[];
	rarityRanking?: RarityRankingRecord;
}) {
	const [state, setState] = createStore<TradeState>({
		offeredCards: props.initialOfferedCards ?? [],
		offeredPacks: props.initialOfferedPacks ?? [],
		requestedCards: props.initialRequestedCards ?? [],
		requestedPacks: props.initialRequestedPacks ?? [],
		receiverUsername: props.initialReceiverUsername ?? null,
		form: null,
		get formDataParams() {
			const form = this.form;
			if (!form) return undefined;
			const formData = new FormData(form);
			formData.delete('offeredCards');
			formData.delete('requestedCards');
			formData.delete('offeredPacks');
			formData.delete('requestedPacks');
			state.offeredCards.forEach(card => formData.append('offeredCards', card.instanceId));
			state.requestedCards.forEach(card =>
				formData.append('requestedCards', card.instanceId)
			);
			state.offeredPacks.forEach(pack => formData.append('offeredPacks', pack.packId));
			state.requestedPacks.forEach(pack => formData.append('requestedPacks', pack.packId));

			// @ts-expect-error - there are no files in this form
			return new URLSearchParams([...formData.entries()]);
		},
	});

	const [isLoading, setIsLoading] = createSignal(false);

	const [users] = createResource(() => trpc.users.allUsernames.query(), {
		ssrLoadFrom: 'initial',
		initialValue: [],
	});

	createEffect(
		// When receiverUsername changes, reset requestedCards
		on(
			() => state.receiverUsername,
			receiverUsername => {
				if (!receiverUsername) {
					setState('requestedPacks', []);
					setState('requestedCards', []);
				}
			}
		)
	);

	const [receiverCards] = createResource(
		() => state.receiverUsername,
		receiverUsername => trpc.userCards.byUsername.query({ username: receiverUsername }),
		{
			initialValue: props.initialReceiverCards ?? [],
			ssrLoadFrom: 'initial',
		}
	);

	const [receiverPacks] = createResource(
		() => state.receiverUsername,
		receiverUsername => trpc.packs.byUser.query({ username: receiverUsername }),
		{
			initialValue: props.initialReceiverPacks ?? [],
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

	const receiverPacksUi = () =>
		receiverPacks().map(pack => ({
			...pack,
			get checked() {
				return state.requestedPacks.some(requested => requested.packId === pack.packId);
			},
		}));

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

	const yourPacks = () =>
		props.packs.map(pack => ({
			...pack,
			get checked() {
				return state.offeredPacks.some(requested => requested.packId === pack.packId);
			},
		}));

	updateUrlFromState(state);

	return (
		<>
			<form class="sr-only" id="reset-form"></form>
			<form
				method="post"
				ref={el => setState('form', el)}
				onSubmit={async e => {
					e.preventDefault();
					let receiverUsername = state.receiverUsername;
					if (!receiverUsername) return;
					setIsLoading(true);
					try {
						const result = await trpc.trades.create.mutate({
							offeredCards: state.offeredCards.map(c => c.instanceId),
							offeredPacks: state.offeredPacks.map(p => p.packId),
							receiverUsername: receiverUsername,
							requestedCards: state.requestedCards.map(c => c.instanceId),
							requestedPacks: state.requestedPacks.map(p => p.packId),
							message: state.formDataParams?.get('message') ?? undefined,
						});

						location.assign(`${routes.TRADES}/${result.tradeId}?alert=Trade Created`);
					} catch (error) {
						const params = new URLSearchParams(state.formDataParams);
						if (error instanceof TRPCClientError) {
							params.set('alert', error.message);
							params.set('type', 'error');
							location.assign(`${routes.TRADES}/new?${params.toString()}`);
						}
					} finally {
						setIsLoading(false);
					}
				}}
				class="relative mx-auto max-w-7xl"
				enctype="application/x-www-form-urlencoded">
				<Show when={isLoading()}>
					<Loading loadingText="Sending your trade" />
				</Show>
				<div class="@4xl/main:grid-cols-2 @4xl/main:grid w-full grid-cols-1">
					<Section heading="Offer">
						<input type="hidden" name="senderUsername" value={props.username} />
						<Username>{props.username}</Username>
						<OfferWindow
							cards={state.offeredCards}
							setCards={setter => setState('offeredCards', setter)}
							packs={state.offeredPacks}
							setPacks={setter => setState('offeredPacks', setter)}
						/>
						<CardSearchList
							type="offer"
							label="Your Cards"
							cards={yourCards()}
							setCards={setter => setState('offeredCards', setter)}
							rarityRanking={props.rarityRanking}
						/>
						<Show when={yourPacks().length}>
							<PackTradeList
								type="offer"
								label="Your Packs"
								packs={yourPacks()}
								setPacks={setter => setState('offeredPacks', setter)}
							/>
						</Show>
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
							packs={state.requestedPacks}
							setPacks={setter => setState('requestedPacks', setter)}
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
									rarityRanking={props.rarityRanking}
								/>
								<Show when={receiverPacksUi().length}>
									<PackTradeList
										type="request"
										label={`${state.receiverUsername}'s packs`}
										packs={receiverPacksUi()}
										setPacks={setter => setState('requestedPacks', setter)}
									/>
								</Show>
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
				() => state.offeredPacks.length,
				() => state.requestedPacks.length,
				() => state.receiverUsername,
			],
			() => {
				const params = state.formDataParams;
				if (!params) return;

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
			<div class="text-center">
				<Heading>{props.heading}</Heading>
			</div>
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
