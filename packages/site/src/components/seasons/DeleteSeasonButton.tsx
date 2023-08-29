import { api_paths, routes } from '@/constants';
import { Form, DeleteButton } from '@/components/form/Form';
import { createSignal, } from 'solid-js';

export default function DeleteSeasonButton(props: { seasonId: string }) {
	const apiUrl = localStorage.getItem('api_url') ?? '';

	return (
		<Form
			method="delete"
			action={apiUrl + api_paths.SEASON}
			confirm="Are you sure you want to delete this season?"
			successRedirect={`${routes.SEASONS}?alert=Season%20deleted!&type=success`}>
			<input type="hidden" name="seasonId" value={props.seasonId} />
			<DeleteButton>Delete Season</DeleteButton>
		</Form>
	);
}
