import { Anchor, PageHeader, PageTitle } from '@/components/text';
import TradesTable from '@/components/trades/TradesTable';
import { routes } from '@/constants';
import type { Trade } from '@lil-indigestion-cards/core/db/trades';
import type { User } from '@lil-indigestion-cards/core/db/users';
import { createMemo } from 'solid-js';

export default function Trades(props: {
	data: {
		trades: {
			incoming: Array<Trade>;
			outgoing: Array<Trade>;
		};
		tradeNotifications: Map<string, NonNullable<User['tradeNotifications']>[number]>;
		sessionUserId: string;
	};
}) {
	const trades = createMemo(() => {
		const pending: Trade[] = [];
		const complete: Trade[] = [];
		let completeNotificationCount = 0;

		for (const trade of [...props.data.trades.outgoing, ...props.data.trades.incoming]) {
			if (trade.status === 'pending') pending.push(trade);
			else {
				if (props.data.tradeNotifications.has(trade.tradeId)) completeNotificationCount++;
				complete.push(trade);
			}
		}

		return { pending, complete, completeNotificationCount };
	});

	return (
		<>
			<PageHeader>
				<PageTitle>My Trades</PageTitle>
				<div class="right-4 flex w-full justify-center sm:absolute sm:w-auto">
					<Anchor href={`${routes.TRADES}/new`}>New Trade</Anchor>
				</div>
			</PageHeader>

			<section aria-labelledby="open-trades">
				<h2 id="open-trades" class="sr-only">
					Open Trades
				</h2>
				<TradesTable
					trades={trades().pending}
					notifications={props.data.tradeNotifications}
					sessionUserId={props.data.sessionUserId}
				/>
			</section>

			<br />

			<details open={trades().completeNotificationCount > 0}>
				<summary>Closed Trades</summary>
				<TradesTable
					trades={trades().complete}
					notifications={props.data.tradeNotifications}
					sessionUserId={props.data.sessionUserId}
				/>
			</details>
		</>
	);
}
