import { DeleteButton, Form } from '@/components/form/Form';
import { API, routes } from '@/constants';

export default function DeleteImageButton(props: { key: string; type: string }) {
	return (
		<Form
			action={API.UNMATCHED_IMAGE}
			method="delete"
			successRedirect={routes.CARDS + '?alert=Draft Deleted'}>
			<input type="hidden" name="key" value={props.key} />
			<input type="hidden" name="type" value={props.type} />
			<DeleteButton>Delete Draft</DeleteButton>
		</Form>
	);
}
