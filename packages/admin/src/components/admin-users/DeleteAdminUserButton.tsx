import { DeleteButton, Form } from '@admin/components/form/Form';
import { API } from '@admin/constants';

export default function DeleteAdminUserButton(props: {
	userId: string;
	username: string;
	isStreamer: boolean;
	onClick?: () => void;
	onSuccess?: () => void;
}) {
	return (
		<Form
			action={API.ADMIN_USER}
			method="delete"
			onsuccess={props.onSuccess}
			onsubmit={props.onClick}
			confirm="Are you sure you want to delete this user?">
			<input type="hidden" name="userId" value={props.userId} />
			<input type="hidden" name="username" value={props.username} />
			<input type="hidden" name="isStreamer" value={props.isStreamer.toString()} />
			<DeleteButton />
		</Form>
	);
}
