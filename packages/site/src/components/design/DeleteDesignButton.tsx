import { DeleteButton, Form } from '@/components/form/Form';
import { API, routes } from '@/constants';

export default function DeleteDesignButton(props: {
	designId: string;
	imgUrl: string;
	cardName: string;
}) {
	return (
		<Form
			action={API.DESIGN}
			method="delete"
			confirm="Are you sure you want to delete this card?"
			successRedirect={`${routes.DESIGNS}?alert=Card%20deleted!&type=success`}>
			<input type="hidden" name="designId" value={props.designId} />
			<input type="hidden" name="imgUrl" value={props.imgUrl} />
			<input type="hidden" name="cardName" value={props.cardName} />
			<DeleteButton>Delete Card</DeleteButton>
		</Form>
	);
}
