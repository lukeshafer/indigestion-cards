import type { Trade } from '@lil-indigestion-cards/core/db/trades';
import { For, Match, Show, Switch } from 'solid-js';

export default function TradeMessageHistory(props: { trade: Trade }) {
	const offerMsg = () =>
		props.trade.messages.find((msg) => msg.userId === props.trade.senderUserId);
	const responseMsg = () =>
		props.trade.messages.find((msg) => msg.userId === props.trade.receiverUserId);

	return (
		<ul class="col-span-full grid min-h-[8rem] w-[32rem] max-w-full gap-3 justify-self-center rounded-lg bg-gray-200 px-6 py-4 dark:bg-gray-900">
			<li class="text-center text-gray-600 dark:text-gray-400">
				{props.trade.senderUsername} initiated the trade.
			</li>
			<Show when={offerMsg() !== undefined}>
				<li class="min-h-[5rem] w-fit max-w-[15rem] justify-self-start rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800">
					<p class="font-semibold text-gray-600 dark:text-gray-400">
						{props.trade.senderUsername}
					</p>
					<p class="pb-1 text-blue-600 dark:text-blue-400">Request</p>
					<p class="message">{offerMsg()?.message}</p>
				</li>
			</Show>
			<Show when={responseMsg() !== undefined}>
				<li class="min-h-[5rem] w-fit max-w-[15rem] justify-self-end rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800">
					<p class="text-right font-semibold text-gray-600 dark:text-gray-400">
						{props.trade.receiverUsername}
					</p>
					<p
						class="pb-1 "
						classList={{
							'text-red-600 dark:text-red-400': props.trade.status === 'rejected',
							'text-brand-dark dark:text-brand-main':
								props.trade.status !== 'rejected',
						}}>
						<Switch fallback="Response">
							<Match when={props.trade.status === 'rejected'}>Rejected</Match>
							<Match when={props.trade.status === 'accepted'}>Accepted</Match>
						</Switch>
					</p>
					<p class="message">{responseMsg()?.message}</p>
				</li>
			</Show>
			<For each={props.trade.messages}>
				{(msg) => {
					const isFromSender = msg.userId === props.trade.senderUserId;
					const username = isFromSender
						? props.trade.senderUsername
						: props.trade.receiverUsername;
					return (
						<>
							{!isFromSender ? (
								<li>
									{username} responded with status {props.trade.status}
								</li>
							) : null}
						</>
					);
				}}
			</For>
			<Switch>
				<Match when={props.trade.status === 'canceled'}>
					<li class="text-center text-red-700 dark:text-red-400">
						{props.trade.senderUsername} canceled the trade.
					</li>
				</Match>
				<Match
					when={props.trade.status === 'accepted' || props.trade.status === 'completed'}>
					<li class="text-center text-blue-700 dark:text-blue-400">
						{props.trade.receiverUsername} accepted the trade.
					</li>
				</Match>
				<Match when={props.trade.status === 'pending'}>
					<li class="text-center text-gray-600 dark:text-gray-400">
						{props.trade.receiverUsername} has not responded.
					</li>
				</Match>
				<Match when={props.trade.status === 'rejected'}>
					<li class="text-center text-red-700 dark:text-red-400">
						{props.trade.receiverUsername} rejected the trade.
					</li>
				</Match>
			</Switch>
		</ul>
	);
}
