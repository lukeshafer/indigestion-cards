import { API, routes } from '@admin/constants';
import { Form, TextInput, IdInput, SubmitButton } from '@admin/components/form/Form';
import { createSignal } from 'solid-js';

export default function SeasonForm(props: { seasonName?: string }) {
	// eslint-disable-next-line solid/reactivity
	const [seasonName, setSeasonName] = createSignal(props.seasonName ?? '');

	return (
		<Form
			method="post"
			action={API.SEASON}
			successRedirect={`${routes.SEASONS}?alert=Season%20created!&type=success`}>
			<TextInput label="Season Name" name="seasonName" required setValue={setSeasonName} />
			<IdInput label="Season ID" name="seasonId" required from={seasonName()} />
			<TextInput label="Description" name="seasonDescription" />
			<SubmitButton />
		</Form>
	);
}
