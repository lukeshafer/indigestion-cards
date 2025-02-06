import type { CardInstance } from '@core/types';
import { For, type Component } from 'solid-js';
import { createTable, Table, TBody, TCell, THead, THeading, TRow } from '../Table';
import { routes } from '@site/constants';
import { Anchor, Heading } from '../text';

export const CardTradeHistory: Component<{
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
			<Table>
				<THead>
					<THeading table={table} name="date">
						Date
					</THeading>
					<THeading table={table} name="from">
						From
					</THeading>
					<THeading table={table} name="to">
						To
					</THeading>
					<THeading table={table} name="actions" />
				</THead>
				<TBody>
					<For each={table.rows}>
						{row => (
							<TRow>
								<TCell>{new Date(row.date).toLocaleDateString()}</TCell>
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
								<TCell>
									<Anchor href={`${routes.TRADES}/${row.tradeId}`}>
										View Trade
									</Anchor>
								</TCell>
							</TRow>
						)}
					</For>
				</TBody>
			</Table>
		</article>
	);
};
