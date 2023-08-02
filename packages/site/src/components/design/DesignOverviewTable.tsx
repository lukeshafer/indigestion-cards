import Table from '@/components/table/Table';

export default function DesignOverviewTable(props: {
	rarityStatsArray: {
		rarityName: string;
		received: number;
		opened: number;
		unopened: number;
		notGivenOut: number;
		total: number;
	}[];
}) {
	return (
		<Table
			compact
			columns={[
				{
					name: 'rarityName',
					label: 'Rarity',
					font: 'title',
				},
				{
					name: 'received',
					label: 'Received',
					type: 'number',
				},
				{
					name: 'opened',
					label: 'Opened',
					type: 'number',
					showOnBreakpoint: 'lg',
				},
				{
					name: 'unopened',
					label: 'Unopened',
					type: 'number',
					showOnBreakpoint: 'lg',
				},
				{
					name: 'notGivenOut',
					label: 'Not Received',
					type: 'number',
					showOnBreakpoint: 'sm',
				},
				{
					name: 'total',
					label: 'Total',
					type: 'number',
				},
			]}
			rows={props.rarityStatsArray.map((rarityStats) => ({
				rarityName: rarityStats.rarityName,
				received: rarityStats.received,
				opened: rarityStats.opened,
				unopened: rarityStats.unopened,
				notGivenOut: rarityStats.notGivenOut,
				total: rarityStats.total,
			}))}
		/>
	);
}
