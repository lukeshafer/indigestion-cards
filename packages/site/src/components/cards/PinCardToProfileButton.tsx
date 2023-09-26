import { USER_API } from '@/constants';
import { Form, SubmitButton } from '../form';
import { BsPin, BsPinFill } from 'solid-icons/bs';

export default function PinCardToProfileButton(props: {
	userId: string;
	instanceId: string;
	designId: string;
	children?: string;
}) {
	return (
		<Form action={USER_API.USER} method="patch">
			<input type="hidden" name="userId" value={props.userId} />
			<input type="hidden" name="pinnedCardId" value={props.instanceId} />
			<input type="hidden" name="pinnedCardDesignId" value={props.designId} />
			<SubmitButton>{props.children || <BsPin />}</SubmitButton>
		</Form>
	);
}
