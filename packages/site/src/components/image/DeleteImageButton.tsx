import { DeleteButton, Form } from '@/components/form/Form';
import { api } from '@/constants';

export default function DeleteImageButton(props: { key: string; type: string }) {
	return (
		<Form action={api.IMAGE.DELETE} method="delete">
			<input type="hidden" name="key" value={props.key} />
			<input type="hidden" name="type" value={props.type} />
			<DeleteButton>Delete Draft</DeleteButton>
		</Form>
	);
}
