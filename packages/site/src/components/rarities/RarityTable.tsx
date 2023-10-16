import Table from '@/components/table/Table';
import type { Rarity } from '@lil-indigestion-cards/core/db/rarities';
import DeleteRarityButton from './DeleteRarityButton';
import { SubmitButton } from '../form';
import { Show, createSignal } from 'solid-js';

export default function RarityTable(props: { rarities: Rarity[] }) {
	return (
		<Table
			columns={[
				{
					name: 'name',
					label: 'Name',
					font: 'title',
					width: '40%',
				},
				{
					name: 'count',
					label: 'Default Count',
					showOnBreakpoint: 'sm',
					type: 'number',
				},
				{
					name: 'actions',
					label: 'Actions',
					sort: false,
				},
			]}
			rows={props.rarities.map((rarity) => ({
				name: rarity.rarityName,
				count: rarity.defaultCount,
				actions: {
					element: (
						<>
							<div>
								<DeleteRarityButton {...rarity} />
								<RarityPreview rarity={rarity} />
							</div>
						</>
					),
					value: '',
				},
			}))}
		/>
	);
}

function RarityPreview(props: { rarity: Rarity }) {
	const [isPreviewing, setIsPreviewing] = createSignal(false);
	const text = () => (isPreviewing() ? 'Hide' : 'Preview');

	return (
		<div>
			<SubmitButton onClick={() => setIsPreviewing((v) => !v)}>{text()}</SubmitButton>
			<Show when={isPreviewing()}>
				<img src={props.rarity.frameUrl} />
			</Show>
		</div>
	);
}
