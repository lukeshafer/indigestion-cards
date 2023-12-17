import type { Trade } from '@lil-indigestion-cards/core/db/trades';
import { For, Match, Switch, createResource, type ResourceActions, Show, onMount } from 'solid-js';
import { SubmitButton, TextInput } from '../form/Form';
import { get } from '@/lib/client/data';

export default function TradeMessageHistory(props: { trade: Trade; loggedInUserId?: string }) {
	const [messages, messagesActions] = createResource(
		() => props.trade.tradeId,
		async (tradeId) => {
			const trade = await get('trades', [tradeId]);
			return trade.messages;
		},
		{
			ssrLoadFrom: 'initial',
			// eslint-disable-next-line
			initialValue: props.trade.messages,
		}
	);

	onMount(() => {
		let hasFocus = true;
		setInterval(() => {
			if (!hasFocus && document.hasFocus()) {
				hasFocus = true;
				messagesActions.refetch();
			} else if (hasFocus && !document.hasFocus()) {
				hasFocus = false;
			}
		}, 1000);
		setInterval(() => {
			if (document.hasFocus()) {
				messagesActions.refetch();
			}
		}, 10000);
	});

	return (
		<ul class="col-span-full grid min-h-[8rem] w-[32rem] max-w-full gap-3 justify-self-center rounded-lg bg-gray-200 px-6 py-4 dark:bg-gray-900">
			<For each={messages()}>
				{(message) => <Message message={message} trade={props.trade} />}
			</For>
			<Show
				when={
					(props.loggedInUserId === props.trade.senderUserId ||
						props.loggedInUserId === props.trade.receiverUserId) &&
					props.loggedInUserId
				}>
				{(loggedInUserId) => (
					<MessageInput actions={messagesActions} loggedInUserId={loggedInUserId()} />
				)}
			</Show>
		</ul>
	);
}

function MessageInput(props: {
	actions: ResourceActions<Trade['messages']>;
	loggedInUserId: string;
}) {
	return (
		<form
			method="post"
			onSubmit={async (e) => {
				e.preventDefault();
				const data = new FormData(e.currentTarget);
				const message = data.get('message');

				// eslint-disable-next-line
				props.actions.mutate((msgs) =>
					msgs.concat([
						{
							message: message?.toString() ?? '',
							type: 'message',
							userId: props.loggedInUserId,
						},
					])
				);

				e.currentTarget.message.value = '';

				await fetch(window.location.href, {
					method: 'post',
					body: new URLSearchParams(data as unknown as string),
				});

				props.actions.refetch();
			}}>
			<div class="flex w-full gap-1">
				<TextInput name="message" label="Send a message." inputOnly required />
				<SubmitButton>Send</SubmitButton>
			</div>
		</form>
	);
}

function Message(props: { message: Trade['messages'][number]; trade: Trade }) {
	return (
		<Switch>
			<Match
				when={
					props.message.type === 'message' &&
					props.message.userId !== props.trade.receiverUserId &&
					props.message.userId !== props.trade.senderUserId
				}>
				{''}
			</Match>
			<Match when={props.message.type === 'message'}>
				<UserMessage
					message={props.message.message}
					type={props.message.userId === props.trade.senderUserId ? 'left' : 'right'}
					username={
						props.message.userId === props.trade.senderUserId
							? props.trade.senderUsername
							: props.message.userId === props.trade.receiverUserId
							? props.trade.receiverUsername
							: ''
					}
				/>
			</Match>
			<Match when={props.message.type === 'status-update'}>
				<StatusMessage
					message={props.message.message}
					senderUsername={props.trade.senderUsername}
					receiverUsername={props.trade.receiverUsername}
				/>
			</Match>
			<Match when={props.message.type === 'offer'}>
				<UserMessage
					message={props.message.message}
					type="left"
					username={props.trade.senderUsername}
				/>
			</Match>
			<Match when={props.message.type === 'response'}>
				<UserMessage
					message={props.message.message}
					type="right"
					username={props.trade.receiverUsername}
				/>
			</Match>
		</Switch>
	);
}

function UserMessage(props: { message: string; username: string; type: 'left' | 'right' }) {
	return (
		<li
			class="h-fit min-h-[2rem] w-fit max-w-[15rem] justify-self-end rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800"
			classList={{
				'justify-self-end': props.type === 'right',
				'justify-self-start': props.type === 'left',
			}}>
			<p
				class="font-semibold text-gray-600 dark:text-gray-400"
				classList={{ 'text-right': props.type === 'right' }}>
				{props.username}
			</p>
			<p class="message">{props.message}</p>
		</li>
	);
}

function StatusMessage(props: {
	message: string;
	senderUsername: string;
	receiverUsername: string;
}) {
	return (
		<Switch>
			<Match when={props.message === 'pending'}>
				<li class="text-center text-gray-600 dark:text-gray-400">
					{props.senderUsername} initiated the trade.
				</li>
			</Match>
			<Match when={props.message === 'canceled'}>
				<li class="text-center text-red-700 dark:text-red-400">
					{props.senderUsername} canceled the trade.
				</li>
			</Match>
			<Match when={props.message === 'accepted' || props.message === 'completed'}>
				<li class="text-center text-blue-700 dark:text-blue-400">
					{props.receiverUsername} accepted the trade.
				</li>
			</Match>
			<Match when={props.message === 'pending'}>
				<li class="text-center text-gray-600 dark:text-gray-400">
					{props.receiverUsername} has not responded.
				</li>
			</Match>
			<Match when={props.message === 'rejected'}>
				<li class="text-center text-red-700 dark:text-red-400">
					{props.receiverUsername} rejected the trade.
				</li>
			</Match>
		</Switch>
	);
}
