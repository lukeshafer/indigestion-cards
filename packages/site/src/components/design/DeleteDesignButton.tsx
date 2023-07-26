import { DeleteButton, Form } from '@/components/form/Form';
import { api } from '@/constants';

export default function DeleteDesignButton(props: {
	designId: string;
	imgUrl: string;
	cardName: string;
}) {
	return (
		<Form
			action={api.DESIGN.DELETE}
			method="delete"
			confirm="Are you sure you want to delete this card?">
			<input type="hidden" name="designId" value={props.designId} />
			<input type="hidden" name="imgUrl" value={props.imgUrl} />
			<input type="hidden" name="cardName" value={props.cardName} />
			<DeleteButton>Delete Card</DeleteButton>
		</Form>
	);
}
