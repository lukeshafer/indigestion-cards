import { API, routes } from '@/constants';
import { DeleteButton, Form } from '../form/Form';

export default function DeletePackTypeButton(props: { packTypeId: string }) {
	return (
		<Form
			action={API.PACK_TYPE}
			method="delete"
			confirm="Are you sure you want to delete this pack type?"
			successRedirect={`${routes.PACK_TYPES}?alert=Pack%20type%20deleted!&type=success`}>
			<input type="hidden" name="packTypeId" value={props.packTypeId} />
			<DeleteButton>Delete Pack Type</DeleteButton>
		</Form>
	);
}
