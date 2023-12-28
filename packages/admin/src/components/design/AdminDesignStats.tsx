import { Index, createSignal } from 'solid-js';
import type { RarityStats } from '@lib/stats';
import Table from '@/components/table/Table';
import { routes } from '@/constants';
import { Checkbox } from '@/components/form/Form';

export default function AdminDesignStats(props: { rarityStatsArray: RarityStats[] }) {
	const [hideUnowned, setHideUnowned] = createSignal(false);

	return (
		<section>
			<header class="flex items-center gap-6">
				<h2 class="font-heading my-2 text-2xl font-medium uppercase leading-5">
					Instance Breakdown
				</h2>
				<Checkbox label="Hide Unowned" setValue={setHideUnowned} name="hide-unowned" />
			</header>
			<ul>
				<Index each={props.rarityStatsArray}>
					{(rarity) => <RarityStatsTable {...rarity()} hideUnowned={hideUnowned()} />}
				</Index>
			</ul>
		</section>
	);
}

function RarityStatsTable(props: RarityStats & { hideUnowned: boolean }) {
	const rows = () =>
		props.instances.filter((instance) => !props.hideUnowned || instance?.username);

	return (
		<li class="my-8">
			<h3 class="font-heading my-2 text-xl font-medium uppercase leading-5">
				{props.rarityName}
			</h3>
			<Table
				compact
				columns={[
					{
						label: 'Card Number',
						type: 'number',
						name: 'cardNumber',
						width: '20%',
					},
					{
						label: 'Owner',
						name: 'username',
					},
					{
						label: 'Opened At',
						type: 'date',
						name: 'openedAt',
					},
				]}
				rows={rows().map((instance, index) => ({
					cardNumber: instance?.cardNumber ?? index + 1,
					username: {
						element: (
							<>
								{instance?.username ? (
									<a href={`${routes.USERS}/${instance?.username ?? ''}`}>
										{instance.username}
									</a>
								) : (
									'Not Owned'
								)}
							</>
						),
						value: instance?.username ?? '',
					},
					openedAt: instance?.openedAt
						? new Date(instance.openedAt).toLocaleDateString()
						: '',
				}))}
			/>
		</li>
	);
}
