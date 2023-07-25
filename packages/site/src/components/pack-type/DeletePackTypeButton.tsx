import { api } from '@/constants';
import { DeleteButton, Form } from '../form/Form';

export default function DeletePackTypeButton(props: { packTypeId: string }) {
	return (
		<Form
			action={api.PACK_TYPE.DELETE}
			method="delete"
			confirm="Are you sure you want to delete this pack type?">
			<input type="hidden" name="packTypeId" value={props.packTypeId} />
			<DeleteButton>Delete Pack Type</DeleteButton>
		</Form>
	);
}
