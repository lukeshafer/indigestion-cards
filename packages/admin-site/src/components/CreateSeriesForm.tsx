import { Form, TextInput } from './Form'

export default function CreateSeries(props: { url: string }) {
	return (
		<Form action={props.url}>
			<TextInput id="name" required>
				Series Name
			</TextInput>
			<TextInput
				id="seriesId"
				bind={{
					id: ['name'] as const,
					transform: ({ name }) => name?.toLowerCase().replace(/ /g, '-'),
				}}
				required>
				Series ID
			</TextInput>
			<TextInput id="description">Description</TextInput>
		</Form>
	)
}
