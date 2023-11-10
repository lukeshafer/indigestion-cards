import { createStore } from 'solid-js/store';
import type { TradeCard } from '@lil-indigestion-cards/core/db/trades';
import { Suspense, createResource, onMount, type JSX, Show, createEffect, on } from 'solid-js';
import { trpc } from '@/lib/trpc';
import { Loading, SubmitButton, TextArea, TextInput } from '../form/Form';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import { USER_API } from "@/constants"
import { Heading } from '@/components/text';
import { users, fetchUsers } from '@/lib/client/state';
import CardSearchList from './CardSearchList';
import OfferWindow from './OfferWindow';
import { css } from '@acab/ecsstatic';

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
}) {
	const [state, setState] = createStore<TradeState>({
		offeredCards: props.initialOfferedCards ?? [],
		requestedCards: props.initialRequestedCards ?? [],
		receiverUsername: props.initialReceiverUsername ?? null,
		form: null,
	});

	createEffect(
		// When receiverUsername changes, reset requestedCards
		on(
			() => state.receiverUsername,
			() => {
				if (!state.receiverUsername) setState('requestedCards', []);
			}
		)
	);

	onMount(() => {
		fetchUsers();
	});

	const [receiverCards] = createResource(
		() => state.receiverUsername,
		(receiverUsername) => trpc.cards.byUserId.query({ username: receiverUsername }),
		{
			initialValue: props.initialReceiverCards ?? [],
			ssrLoadFrom: 'initial',
		}
	);

	const receiverCardsUi = () =>
		receiverCards().map((card) => ({
			...card,
			get checked() {
				return state.requestedCards.some(
					(requested) => requested.instanceId === card.instanceId
				);
			},
		})) satisfies TradeCardUi[];

	const yourCards = () =>
		props.cardInstances.map((card) => ({
			...card,
			get checked() {
				return state.offeredCards.some((offered) => offered.instanceId === card.instanceId);
			},
		})) satisfies TradeCardUi[];

	updateUrlFromState(state);

	return (
		<>
			<form class="sr-only" id="reset-form"></form>
			<form
				method="post"
				action={USER_API.TRADE}
				ref={(el) => setState('form', el)}
				class={css`
					display: grid;
					grid-template-columns: 1fr 1fr;
					@container main (max-width: 600px) {
						grid-template-columns: 1fr;
					}
				`}>
				<Section heading="Offer">
					<input type="hidden" name="senderUsername" value={props.username} />
					<Username>{props.username}</Username>
					<OfferWindow
						type="offer"
						cards={state.offeredCards}
						setCards={(setter) => setState('offeredCards', setter)}
					/>
					<CardSearchList
						type="offer"
						label="Your Cards"
						cards={yourCards()}
						setCards={(setter) => setState('offeredCards', setter)}
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
									onInvalid={(e) =>
										e.currentTarget.setCustomValidity('Please select a user')
									}
									required
									list="users"
									onChange={(e) => {
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
									onClick={(e) => {
										e.preventDefault();
										const input = e.target.previousSibling as HTMLInputElement;
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
						type="request"
						cards={state.requestedCards}
						setCards={(setter) => setState('requestedCards', setter)}
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
								setCards={(setter) => setState('requestedCards', setter)}
							/>
						</Suspense>
					</Show>
				</Section>
				<div class="col-span-full grid grid-cols-[minmax(auto,30rem)] flex-col justify-center justify-items-start gap-2">
					<TextArea
						name="message"
						label="Message"
						placeholder="Write a message to the other user"
					/>
					<SubmitButton />
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
