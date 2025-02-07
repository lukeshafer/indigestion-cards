import type { User } from '@core/types';
import { DeleteButton, Form, SubmitButton, TextInput } from '@site/components/Form';
import { USER_API } from '@site/constants';
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
		<Form action={USER_API.USER} method="patch" onsubmit={() => props.setIsEditing(false)}>
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
		</Form>
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
