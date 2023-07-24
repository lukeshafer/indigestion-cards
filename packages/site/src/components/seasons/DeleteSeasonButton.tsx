import { api } from '@/constants';
import { Form, DeleteButton } from '@/components/form/Form';
import { createSignal } from 'solid-js';

export default function DeleteSeasonButton(props: { seasonId: string }) {
	return (
		<Form
			method="delete"
			action={api.SEASON.DELETE}
			confirm="Are you sure you want to delete this season?">
			<input type="hidden" name="seasonId" value={props.seasonId} />
			<DeleteButton>Delete Season</DeleteButton>
		</Form>
	);
}
