import type { User } from '@core/types';
import { DeleteButton, SubmitButton, TextInput } from '@site/components/Form';
import { pushAlert } from '@site/client/state';
import { trpc } from '@site/client/api';
import { Show, createSignal, type Setter } from 'solid-js';

export default function UserMinecraftUsername(props: { initialUser: User }) {
	const [minecraftUsername, setMinecraftUsername] = createSignal(
		props.initialUser.minecraftUsername || ''
	);
	const [isEditing, setIsEditing] = createSignal(false);

	return (
		<div class="py-4 text-gray-800 dark:text-gray-100">
			<Show
				when={isEditing()}
				fallback={
					<UsernameDisplay username={minecraftUsername()} setIsEditing={setIsEditing} />
				}>
				<EditingForm
					setIsEditing={setIsEditing}
					username={minecraftUsername()}
					setUsername={setMinecraftUsername}
					userId={props.initialUser.userId}
				/>
			</Show>
		</div>
	);
}

function EditingForm(props: {
	setIsEditing: Setter<boolean>;
	username: string;
	setUsername: Setter<string>;
	userId: string;
}) {
	return (
		<form
			onSubmit={e => {
				e.preventDefault();
				trpc.users.update
					.mutate({ minecraftUsername: props.username })
					.then(() =>
						pushAlert({ message: 'Minecraft username updated.', type: 'success' })
					)
					.catch(() => pushAlert({ message: 'An error occurred.', type: 'error' }));
				props.setIsEditing(false);
			}}>
			<input type="hidden" name="userId" value={props.userId} />
			<TextInput
				value={props.username}
				maxLength={100}
				name="minecraftUsername"
				label="Minecraft Username"
				setValue={props.setUsername}
			/>
			<div class="flex items-center gap-2">
				<SubmitButton>Save</SubmitButton>
				<DeleteButton onClick={() => props.setIsEditing(false)}>Cancel</DeleteButton>
			</div>
		</form>
	);
}

function UsernameDisplay(props: { username: string; setIsEditing: Setter<boolean> }) {
	return (
		<>
			<p>
				{props.username
					? `Minecraft username: ${props.username}`
					: 'No Minecraft username set.'}
			</p>
			<SubmitButton onClick={() => props.setIsEditing(true)}>Edit</SubmitButton>
		</>
	);
}
