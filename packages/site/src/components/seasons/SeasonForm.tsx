import { api_paths, routes } from '@/constants';
import { Form, TextInput, IdInput, SubmitButton } from '@/components/form/Form';
import { createSignal } from 'solid-js';

export default function SeasonForm(props: { seasonName?: string }) {
	const [seasonName, setSeasonName] = createSignal(props.seasonName ?? '');
	const apiUrl = localStorage.getItem('api_url') ?? '';

	return (
		<Form
			method="post"
			action={apiUrl + api_paths.SEASON}
			successRedirect={`${routes.SEASONS}?alert=Season%20created!&type=success`}>
			<TextInput label="Season Name" name="seasonName" required setValue={setSeasonName} />
			<IdInput label="Season ID" name="seasonId" required from={seasonName()} />
			<TextInput label="Description" name="seasonDescription" />
			<SubmitButton />
		</Form>
	);
}
