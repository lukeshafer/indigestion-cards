import type { Trade } from '@lil-indigestion-cards/core/db/trades';
import Table from '../table/Table';
import { Anchor } from '../text';
import { Show } from 'solid-js';

export default function TradesTable(props: {
  incomingTrades: Trade[];
  outgoingTrades: Trade[];
  loggedInUsername: string;
}) {
  const trades = () =>
    [...props.incomingTrades, ...props.outgoingTrades].sort(
      (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
    );
  const isLoggedInUsername = (name: string) =>
    name.toUpperCase() === props.loggedInUsername.toUpperCase();

  return (
    <Table
      columns={[
        { name: 'dateCreated', label: 'Date', startDescending: true },
        { name: 'with', label: 'With', font: 'title', hideOnBreakpoint: 'sm' },
        { name: 'to', label: 'To', font: 'title', showOnBreakpoint: 'sm' },
        { name: 'from', label: 'From', font: 'title', showOnBreakpoint: 'sm' },
        { name: 'tradeType', label: 'Type', width: '15%', showOnBreakpoint: 'sm' },
        { name: 'status', label: 'Status', showOnBreakpoint: 'sm' },
        { name: 'actions', label: '', sort: false },
      ]}
      rows={trades().map((trade) => ({
        dateCreated: {
          value: trade.createdAt || 0,
          element: (
            <Show when={trade.createdAt}>
              {(date) => (
                <time datetime={new Date(date()).toISOString()}>
                  {new Date(date()).toLocaleDateString()}
                </time>
              )}
            </Show>
          ),
        },
        tradeType: isLoggedInUsername(trade.senderUsername) ? 'Outgoing' : 'Incoming',
        with: isLoggedInUsername(trade.senderUsername)
          ? trade.receiverUsername
          : trade.senderUsername,
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
