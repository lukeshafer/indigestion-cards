import { Form, Select, SubmitButton } from '@/components/form/Form';
import type { PackTypeEntity, RarityEntity } from '@lil-indigestion-cards/core/card';
import type { TwitchEventEntity } from '@lil-indigestion-cards/core/site-config';
import { API } from '@/constants';
import { Show, createSignal } from 'solid-js';
import Table from '../table/Table';

export default function SiteConfigForm(props: {
	baseRarityValue: string;
	rarities: RarityEntity[];
	twitchEvents: TwitchEventEntity[];
	packTypes: PackTypeEntity[];
	giftSubEvent: TwitchEventEntity;
}) {
	const [isEdited, setIsEdited] = createSignal(false);
	const [rarity, setRarity] = createSignal(props.baseRarityValue);

	return (
		<Form action={API.SITE_CONFIG} method="post" onsuccess={() => setIsEdited(false)}>
			<Show when={isEdited()}>
				<SubmitButton>Save</SubmitButton>
			</Show>
			<Select
				name="base-rarity"
				label="Base Rarity for Design Previews"
				value={rarity()}
				setValue={(val) => {
					setIsEdited(true);
					setRarity(val);
				}}
				options={props.rarities.map((rarity) => {
					const value = new URLSearchParams({
						rarityId: rarity.rarityId,
						frameUrl: rarity.frameUrl,
						rarityColor: rarity.rarityColor,
						rarityName: rarity.rarityName,
					}).toString();
					return { value, label: rarity.rarityName };
				})}
			/>
			<Table
				search={{
					label: 'Search Events',
					column: 'event',
				}}
				columns={[
					{
						name: 'event',
						label: 'Event',
						font: 'title',
						width: '66%',
					},
					{
						name: 'packType',
						label: 'Pack Type',
						sort: false,
					},
				]}
				rows={[
					{
						event: '5 Gift Subs',
						packType: {
							element: (
								<TwitchEventSelect
									twitchEvent={props.giftSubEvent}
									packTypes={props.packTypes}
									onChange={(val) => {
										setIsEdited(true);
									}}
								/>
							),
							value: '',
						},
					},
					...props.twitchEvents.map((event) => ({
						event: `Reward: ${event.eventName}`,
						packType: {
							element: (
								<TwitchEventSelect
									twitchEvent={event}
									packTypes={props.packTypes}
									onChange={(val) => {
										setIsEdited(true);
									}}
								/>
							),
							value: '',
						},
					})),
				]}
			/>
		</Form>
	);
}

function TwitchEventSelect(props: {
	twitchEvent: TwitchEventEntity;
	packTypes: PackTypeEntity[];
	onChange?: (val: string) => void;
}) {
	const value = () =>
		JSON.stringify({
			packTypeId: props.twitchEvent.packTypeId ?? '',
			packTypeName: props.twitchEvent.packTypeName ?? '',
		});

	return (
		<Select
			name={`event-type-${props.twitchEvent.eventId}`}
			value={value()}
			setValue={(val) => {
				console.log(val);
				props.onChange?.(val);
			}}
			options={[
				{
					label: 'None',
					value: JSON.stringify({
						packTypeId: '',
						packTypeName: '',
					}),
				},
				...props.packTypes.map((packType) => ({
					label: packType.packTypeName,
					value: JSON.stringify({
						packTypeId: packType.packTypeId,
						packTypeName: packType.packTypeName,
					}),
				})),
			]}
		/>
	);
}
