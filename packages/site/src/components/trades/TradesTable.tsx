import type { Trade, User } from '@core/types';
import { For, type Component } from 'solid-js';
import { createTable, Table, TBody, TCell, THead, THeading, TRow } from '../Table';
import { routes } from '@site/constants';
import { Anchor } from '../text';
import TradeOutIcon from '../icons/TradeOutIcon';
import TradeInIcon from '../icons/TradeInIcon';

type TradeNotificationsMap = Map<string, NonNullable<User['tradeNotifications']>[number]>;

export const TradesTable: Component<{
	trades: Array<Trade>;
	notifications: TradeNotificationsMap;
	loggedInUserId: string;
}> = props => {
	const sortedTrades = () => props.trades.slice().sort(sortTrades(props.notifications));
	const checkIsLoggedInUserId = (id: string) =>
		id.toUpperCase() === props.loggedInUserId.toUpperCase();

	const table = createTable(
		() => ({
			tradeType: {
				startDescending: true,
				type: 'text',
			},
			dateCreated: {
				startDescending: true,
				type: 'date',
			},
			from: 'text',
			to: 'text',
			status: 'text',
			actions: 'text',
			tradeId: 'text',
		}),
		() =>
			sortedTrades().map(trade => ({
				tradeType: checkIsLoggedInUserId(trade.senderUserId) ? 'Outgoing' : 'Incoming',
				dateCreated: trade.createdAt || 0,
				from: trade.senderUsername,
				to: trade.receiverUsername,
				status: getTradeStatus(trade, props.notifications, checkIsLoggedInUserId),
				actions: '',
				tradeId: trade.tradeId,
			}))
	);

	return (
		<Table>
			<THead>
				<THeading table={table} name="tradeType" width="4rem" />
				<THeading table={table} name="dateCreated" width="6rem" showOnBreakpoint="sm">
					Date
				</THeading>
				<THeading table={table} name="from">
					From
				</THeading>
				<THeading table={table} name="to">
					To
				</THeading>
				<THeading table={table} name="status" showOnBreakpoint="sm">
					Status
				</THeading>
				<THeading table={table} name="actions" no-sort width="7rem" />
			</THead>
			<TBody>
				<For each={table.rows}>
					{row => (
						<TRow highlighted={props.notifications.has(String(row.tradeId))}>
							<TCell>
								{row.tradeType === 'Outgoing' ? (
									<TradeOutIcon
										title="Out"
										class="mx-auto max-w-8 text-gray-700 dark:text-gray-100"
										size={30}
									/>
								) : (
									<TradeInIcon
										title="In"
										class="mx-auto max-w-8 text-gray-700 dark:text-gray-100"
										size={30}
									/>
								)}
							</TCell>
							<TCell showOnBreakpoint="sm">
								{row.dateCreated ? (
									<time datetime={new Date(row.dateCreated).toISOString()}>
										{new Date(row.dateCreated).toLocaleDateString()}
									</time>
								) : null}
							</TCell>
							<TCell font="title">
								<a
									href={`${routes.USERS}/${row.from}`}
									class="hover:underline focus:underline">
									{row.from}
								</a>
							</TCell>
							<TCell font="title">
								<a
									href={`${routes.USERS}/${row.to}`}
									class="hover:underline focus:underline">
									{row.to}
								</a>
							</TCell>
							<TCell showOnBreakpoint="sm">{row.status}</TCell>
							<TCell>
								<Anchor href={`/trades/${row.tradeId}`}>View</Anchor>
							</TCell>
						</TRow>
					)}
				</For>
			</TBody>
		</Table>
	);
};

const sortTrades = (notifications: TradeNotificationsMap) => (a: Trade, b: Trade) => {
	if (notifications.has(a.tradeId)) return -1;
	if (notifications.has(b.tradeId)) return 1;
	else return (b.createdAt || 0) - (a.createdAt || 0);
};

const getTradeStatus = (
	trade: Trade,
	notifications: TradeNotificationsMap,
	checkIsLoggedInUserId: (id: string) => boolean
) => {
	if (notifications.get(trade.tradeId)?.status === 'newMessage') return 'New Message';

	const prefix =
		notifications.get(trade.tradeId)?.status === 'statusUpdated' ? 'New Status: ' : '';

	if (trade.status === 'pending' && checkIsLoggedInUserId(trade.senderUserId))
		return prefix + `Waiting on ${trade.receiverUsername}`;
	else if (trade.status === 'pending' && checkIsLoggedInUserId(trade.receiverUserId))
		return prefix + `Awaiting your response`;

	return prefix + trade.status.charAt(0).toUpperCase() + trade.status.slice(1);
};
