import type { Trade } from '@lil-indigestion-cards/core/db/trades';
import Table from '../table/Table';
import { Anchor } from '../text';

export default function TradesTable(props: {
	incomingTrades: Trade[];
	outgoingTrades: Trade[];
	loggedInUsername: string;
}) {
	const trades = () => [...props.incomingTrades, ...props.outgoingTrades];
	const isLoggedInUsername = (name: string) =>
		name.toUpperCase() === props.loggedInUsername.toUpperCase();

	return (
		<Table
			columns={[
				{ name: 'tradeType', label: 'Type', width: '15%' },
				{ name: 'from', label: 'From', font: 'title' },
				{ name: 'to', label: 'To', font: 'title' },
				{ name: 'status', label: 'Status' },
				{ name: 'actions', label: 'Actions', sort: false },
			]}
			rows={trades().map((trade) => ({
				tradeType: isLoggedInUsername(trade.senderUsername) ? 'Outgoing' : 'Incoming',
				from: trade.senderUsername,
				to: trade.receiverUsername,
				status: trade.status.charAt(0).toUpperCase() + trade.status.slice(1),
				actions: {
					value: '',
					element: <Anchor href={`/trades/${trade.tradeId}`}>View</Anchor>,
				},
			}))}
		/>
	);
}
