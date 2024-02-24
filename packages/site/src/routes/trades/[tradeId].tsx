import { Anchor, DeleteButton, Form, SubmitButton } from '@/components/form/Form';
import { Heading } from '@/components/text';
import OfferWindow from '@/components/trades/OfferWindow';
import type { Trade } from '@lil-indigestion-cards/core/db/trades';
import { Match, Show, Switch, onMount } from 'solid-js';
import { formatTradeLink } from '@/lib/client/utils';
import TradeMessageHistory from '@/components/trades/TradeMessageHistory';
import { get } from '@/lib/client/data';

export default function TradePage(props: {
	data: {
		sessionUserId: string;
		trade: Trade;
	};
}) {
	onMount(() => {
		const createTimeout = (time = 1000) => {
			setTimeout(async () => {
				const fetchedTrade = await get('trades', [props.data.trade.tradeId]);
				if (props.data.trade.status !== fetchedTrade.status)
					// TODO: reload by just refetching trade data once implemented
					location.reload();
				if (time < 64000) createTimeout(time * 2);
			}, time);
		};
		createTimeout();
	});

	const isSender = () => props.data.sessionUserId === props.data.trade.senderUserId;
	const isReceiver = () => props.data.sessionUserId === props.data.trade.receiverUserId;

	const tradeStatusText = () => {
		switch (props.data.trade.status) {
			case 'pending':
				if (isReceiver()) return 'Awaiting your response';
				else return `Awaiting ${props.data.trade.receiverUsername}'s response`;
			case 'rejected':
				if (isReceiver()) return 'Rejected by you';
				return `Rejected by ${props.data.trade.receiverUsername}`;
			case 'accepted':
				if (isReceiver()) return 'Accepted, trade processing...';
				else if (isSender())
					return `${props.data.trade.receiverUsername} accepted your trade!`;
				else return `${props.data.trade.receiverUsername} accepted the trade`;
			case 'canceled':
				return `Canceled by ${isSender() ? 'you' : props.data.trade.senderUsername}`;
			case 'completed':
				return 'Trade completed';
			case 'failed':
				return 'Trade failed';
		}
	};
	return (
		<>
			<br />
			<div class="grid-wrapper @xl/main:grid-cols-2 grid grid-cols-1 gap-2">
				<div class="col-span-full text-center">
					<Heading classList={{ grid: true }}>
						<span>STATUS</span>
						<span
							class="text-xl"
							classList={{
								'text-brand-dark dark:text-brand-main':
									props.data.trade.status === 'accepted' ||
									props.data.trade.status === 'completed',
								'text-gray-500 dark:text-gray-400':
									props.data.trade.status === 'pending',
								'text-red-700 dark:text-red-500':
									props.data.trade.status === 'rejected' ||
									props.data.trade.status === 'canceled' ||
									props.data.trade.status === 'failed',
							}}>
							{tradeStatusText()}
						</span>
						<Show when={props.data.trade.statusMessage}>
							<p
								classList={{
									'text-brand-dark dark:text-brand-main':
										props.data.trade.status === 'accepted' ||
										props.data.trade.status === 'completed',
									'text-gray-500 dark:text-gray-400':
										props.data.trade.status === 'pending',
									'text-red-700 dark:text-red-500':
										props.data.trade.status === 'rejected' ||
										props.data.trade.status === 'canceled' ||
										props.data.trade.status === 'failed',
								}}>
								{props.data.trade.statusMessage}
							</p>
						</Show>
					</Heading>
				</div>
				<div class="text-center">
					<h2 class="font-heading my-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
						{isSender() ? 'Your offer' : `${props.data.trade.senderUsername}'s offer`}
					</h2>
					<OfferWindow cards={props.data.trade.offeredCards} />
				</div>
				<div class="text-center">
					<h2 class="font-heading my-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
						{isReceiver()
							? 'Requested from you'
							: `Requested from ${props.data.trade.receiverUsername}`}
					</h2>
					<OfferWindow cards={props.data.trade.requestedCards} />
				</div>
				<TradeMessageHistory
					trade={props.data.trade}
					loggedInUserId={props.data.sessionUserId}
				/>
				<Show when={props.data.trade.status === 'pending'}>
					<div class="col-span-full justify-self-center">
						<Switch>
							<Match when={isSender()}>
								<Form
									method="post"
									enctype="application/x-www-form-urlencoded"
									action={`/api/trades/update-trade/${props.data.trade.tradeId}`}>
									<input type="hidden" name="status" value="canceled" />
									<DeleteButton>Cancel offer</DeleteButton>
								</Form>
							</Match>
							<Match when={isReceiver()}>
								<div class="flex flex-wrap justify-center justify-items-center gap-2">
									<Form
										method="post"
										class="w-fit"
										enctype="application/x-www-form-urlencoded"
										action={`/api/trades/update-trade/${props.data.trade.tradeId}`}>
										<input type="hidden" name="status" value="accepted" />
										<SubmitButton confirm="Are you sure you want to accept this trade? Once accepted, the trade is final and cannot be reversed.">
											<div class="min-w-[8rem]">Accept offer</div>
										</SubmitButton>
									</Form>
									<Form
										method="post"
										class="w-fit"
										enctype="application/x-www-form-urlencoded"
										action={`/api/trades/update-trade/${props.data.trade.tradeId}`}>
										<input type="hidden" name="status" value="rejected" />
										<DeleteButton confirm="Are you sure you want to reject this trade?">
											<div class="min-w-[8rem]">Reject offer</div>
										</DeleteButton>
									</Form>
								</div>
							</Match>
						</Switch>
					</div>
				</Show>
				<Show when={isSender() || isReceiver()}>
					<div class="col-span-2 mx-auto w-fit">
						<Anchor href={formatTradeLink(props.data.trade, isReceiver())}>
							Create Similar Trade
						</Anchor>
					</div>
				</Show>
			</div>
		</>
	);
}
