import { Form, TextInput, Select, DynamicFieldSet, HiddenInput } from './Form'

export default function CreateCardForm(props: {
	seasons: {
		seasonId: string
		seasonName: string
	}[]
	url: string
	imgUrl: string
	imageKey: string
}) {
	const season = props.seasons.map(({ seasonId, seasonName }) => ({
		name: seasonName,
		value: seasonId,
	}))

	return (
		<Form action={props.url}>
			<HiddenInput id="imgUrl" value={props.imgUrl} />
			<HiddenInput id="imageKey" value={props.imageKey} />
			<Select id="seasonId" required options={season}>
				Season
			</Select>
			<TextInput id="cardName" required>
				Card Name
			</TextInput>
			<TextInput id="cardDescription" required>
				Description
			</TextInput>
			<TextInput id="artist" required>
				Artist
			</TextInput>
			<TextInput
				id="designId"
				bind={{
					id: ['seasonId', 'cardName'],
					transform: ({ seasonId, cardName }) =>
						`${seasonId}-${cardName?.toLowerCase().replace(/[ ']/g, '-')}`,
				}}
				required>
				Design ID
			</TextInput>
			<DynamicFieldSet
				id="rarityDetails"
				addButtonLabel="Rarity"
				inputs={[
					{ id: 'rarityLevel', children: 'Rarity Level' },
					{ id: 'count', children: 'Count', type: 'number' },
				]}>
				Rarities
			</DynamicFieldSet>
		</Form>
	)
}
