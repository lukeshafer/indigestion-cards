import Table from '@/components/table/Table';
import type { Pack } from '@lil-indigestion-cards/core/db/packs';
import { Form, SubmitButton, TextInput } from '@/components/form/Form';
import { createSignal } from 'solid-js';
import { API } from '@/constants';

export default function PackTable(props: { packs: Pack[] }) {
	return (
		<>
			{props.packs.length > 0 ? (
			<Table
				columns={[
					{
						name: 'username',
						label: 'Owner',
						width: '50%',
						font: 'title',
					},
					{
						name: 'packTypeName',
						label: 'Pack Type',
					},
					{
						name: 'actions',
						label: 'Actions',
						sort: false,
					},
				]}
				rows={props.packs.map(PackRow)}
			/>
			) : (
				<div class="text-center">
					<p class="text-lg">No packs found.</p>
				</div>
			)}
		</>
	);
}

function PackRow(props: Pack) {
	const [isEditing, setIsEditing] = createSignal(false);
	// eslint-disable-next-line solid/reactivity
	const [username, setUsername] = createSignal(props.username);

	const usernameElement = <Username
		username={username()}
		isEditing={isEditing()}
		setUsername={setUsername}
	/>

	return {
		get username() {
			return {
				element: usernameElement,
				value: username() ?? 'None',
			};
		},
		get packTypeName() {
			return props.packTypeName;
		},
		actions: {
			element: (
				<div>
					{isEditing() ? (
						<Form
							action={API.PACK}
							method="patch"
							onsuccess={() => setIsEditing(false)}>
							<input type="hidden" name="packId" value={props.packId} />
							<input type="hidden" name="username" value={username()} />
							<div class="mx-auto">
								<SubmitButton>Save</SubmitButton>
							</div>
						</Form>
					) : (
						<SubmitButton onClick={() => setIsEditing(true)}>Edit</SubmitButton>
					)}
				</div>
			),
			value: '',
		},
	};
}

function Username(props: {
	username: string | undefined;
	isEditing: boolean;
	setUsername: (value: string) => void;
}) {
	return <>{
		props.isEditing ?
			<TextInput
				inputOnly
				name="username"
				label="Username"
				value={props.username ?? ''}
				setValue={(value) => props.setUsername(value)}
			/> : (props.username ?? 'None')
	}</>
}
