import { Form, TextInput, Select, DynamicFieldSet, HiddenInput } from './Form'

export default function CreateCardForm(props: {
	series: {
		seriesId: string
		seriesName: string
	}[]
	url: string
	imgUrl: string
	imageKey: string
}) {
	const series = props.series.map(({ seriesId, seriesName }) => ({
		name: seriesName,
		value: seriesId,
	}))

	return (
		<Form action={props.url}>
			<HiddenInput id="imgUrl" value={props.imgUrl} />
			<HiddenInput id="imageKey" value={props.imageKey} />
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
			<TextInput
				id="designId"
				bind={{
					id: ['seriesId', 'cardName'],
					transform: ({ seriesId, cardName }) =>
						`${seriesId}-${cardName?.toLowerCase().replace(/[ ']/g, '-')}`,
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
