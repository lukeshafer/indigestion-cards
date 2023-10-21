import { USER_API } from '@/constants';
import { Form, SubmitButton } from '../form/Form';
import { createSignal } from 'solid-js';

export default function PinCardToProfileButton(props: {
	userId: string;
	instanceId: string;
	designId: string;
	isPinned?: boolean;
}) {
	const [isPinned, setIsPinned] = createSignal(props.isPinned);
	const text = () => (isPinned() ? 'Unpin from profile' : 'Pin to profile');

	return (
		<Form action={USER_API.USER} method="patch" onsuccess={() => setIsPinned((v) => !v)}>
			<input type="hidden" name="userId" value={props.userId} />
			<input
				type="hidden"
				name="pinnedCardId"
				value={props.isPinned ? 'null' : props.instanceId}
			/>
			<input
				type="hidden"
				name="pinnedCardDesignId"
				value={props.isPinned ? 'null' : props.designId}
			/>
			<SubmitButton>{text()}</SubmitButton>
		</Form>
	);
}
