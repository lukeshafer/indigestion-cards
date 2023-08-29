import { api_paths, routes } from '@/constants';
import { DeleteButton, Form } from '../form/Form';

export default function DeletePackTypeButton(props: { packTypeId: string; apiUrl: string }) {
	return (
		<Form
			action={props.apiUrl + api_paths.PACK_TYPE}
			method="delete"
			confirm="Are you sure you want to delete this pack type?"
			successRedirect={`${routes.PACK_TYPES}?alert=Pack%20type%20deleted!&type=success`}>
			<input type="hidden" name="packTypeId" value={props.packTypeId} />
			<DeleteButton>Delete Pack Type</DeleteButton>
		</Form>
	);
}
