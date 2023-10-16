import { API, routes } from '@/constants';
import { Form, DeleteButton } from '@/components/form/Form';

export default function DeleteSeasonButton(props: { seasonId: string }) {
	return (
		<Form
			method="delete"
			action={API.SEASON}
			confirm="Are you sure you want to delete this season?"
			successRedirect={`${routes.SEASONS}?alert=Season%20deleted!&type=success`}>
			<input type="hidden" name="seasonId" value={props.seasonId} />
			<DeleteButton>Delete Season</DeleteButton>
		</Form>
	);
}
