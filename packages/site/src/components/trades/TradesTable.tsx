import type { Trade } from '@lil-indigestion-cards/core/db/trades';
import type { User } from '@lil-indigestion-cards/core/db/users';

import Table from '../table/Table';
import { routes } from '@/constants';
import { Anchor } from '../text';
import { For } from 'solid-js';
import IncomingTradeIcon from '../icons/IncomingTradeIcon';
import OutgoingTradeIcon from '../icons/OutgoingTradeIcon';

export default function TradesTable(props: {
	trades: Array<Trade>;
	notifications: Map<string, NonNullable<User['tradeNotifications']>[number]>;
	sessionUserId: string;
}) {
	const sortedTrades = () =>
		props.trades
			.slice()
			.sort((a, b) =>
				props.notifications.has(a.tradeId)
					? -1
					: props.notifications.has(b.tradeId)
						? 1
						: (b.createdAt || 0) - (a.createdAt || 0)
			);

	const isLoggedInUserId = (userId: string) => userId === props.sessionUserId;

	const getTradeStatus = (trade: Trade) => {
		if (props.notifications.get(trade.tradeId)?.status === 'newMessage') return 'New Message';

		const prefix =
			props.notifications.get(trade.tradeId)?.status === 'statusUpdated'
				? 'New Status: '
				: '';

		if (trade.status === 'pending' && isLoggedInUserId(trade.senderUserId))
			return prefix + `Waiting on ${trade.receiverUsername}`;
		else if (trade.status === 'pending' && isLoggedInUserId(trade.receiverUserId))
			return prefix + `Awaiting your response`;

		return prefix + trade.status.charAt(0).toUpperCase() + trade.status.slice(1);
	};

	return (
		<Table.Table>
			<Table.Head>
				<Table.Column name="tradeType" startDescending width="4rem" />
				<Table.Column name="dateCreated" startDescending width="6rem" showOnBreakpoint="sm">
					Date
				</Table.Column>
				<Table.Column name="from" startDescending>
					From
				</Table.Column>
				<Table.Column name="to" startDescending>
					To
				</Table.Column>
				<Table.Column name="status" startDescending showOnBreakpoint="sm">
					Status
				</Table.Column>
				<Table.Column name="actions" startDescending no-sort width="7rem" />
			</Table.Head>
			<Table.Body>
				<For each={sortedTrades()}>
					{trade => (
						<Table.Row highlighted={props.notifications.has(trade.tradeId)}>
							<Table.Cell
								column="tradeType"
								value={
									isLoggedInUserId(trade.senderUserId) ? 'Outgoing' : 'Incoming'
								}>
								{isLoggedInUserId(trade.senderUserId) ? (
									<OutgoingTradeIcon
										title="Out"
										class="mx-auto max-w-8 text-gray-700 dark:text-gray-100"
										size={30}
									/>
								) : (
									<IncomingTradeIcon
										title="In"
										class="mx-auto max-w-8 text-gray-700 dark:text-gray-100"
										size={30}
									/>
								)}
							</Table.Cell>
							<Table.Cell
								column="dateCreated"
								value={trade.createdAt || 0}
								showOnBreakpoint="sm">
								{trade.createdAt ? (
									<time datetime={new Date(trade.createdAt).toISOString()}>
										{new Date(trade.createdAt).toLocaleDateString()}
									</time>
								) : null}
							</Table.Cell>
							<Table.Cell column="from" font="title" value={trade.senderUsername}>
								<a
									href={`${routes.USERS}/${trade.senderUsername}`}
									class="hover:underline focus:underline">
									{trade.senderUsername}
								</a>
							</Table.Cell>
							<Table.Cell column="to" font="title" value={trade.receiverUsername}>
								<a
									href={`${routes.USERS}/${trade.receiverUsername}`}
									class="hover:underline focus:underline">
									{trade.receiverUsername}
								</a>
							</Table.Cell>
							<Table.Cell
								showOnBreakpoint="sm"
								column="status"
								value={getTradeStatus(trade)}
							/>
							<Table.Cell column="actions" value="">
								<Anchor href={`/trades/${trade.tradeId}`}>View</Anchor>
							</Table.Cell>
						</Table.Row>
					)}
				</For>
			</Table.Body>
		</Table.Table>
	);
}
