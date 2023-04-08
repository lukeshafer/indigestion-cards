import { Form, TextInput, Select, DynamicFieldSet } from './Form'

export default function CreateCardForm(props: {
	series: {
		seriesId: string
		seriesName: string
	}[]
	url: string
}) {
	const series = props.series.map(({ seriesId, seriesName }) => ({
		name: seriesName,
		value: seriesId,
	}))

	return (
		<Form action={props.url}>
			<Select id="seriesId" required options={series}>
				Series
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
			<TextInput id="designId" required>
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
