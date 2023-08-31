import Table from '@/components/table/Table';
import type { PackEntity } from '@lil-indigestion-cards/core/pack';
import { Form, SubmitButton, TextInput } from '@/components/form/Form';
import { createSignal } from 'solid-js';
import { API } from '@/constants';

export default function PackTable(props: { packs: PackEntity[] }) {
	return (
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
	);
}

function PackRow(props: PackEntity) {
	const [isEditing, setIsEditing] = createSignal(false);
	const [username, setUsername] = createSignal(props.username);

	return {
		get username() {
			return isEditing()
				? {
						element: (
							<TextInput
								inputOnly
								name="username"
								label="Username"
								value={username()}
								setValue={setUsername}
							/>
						),
						value: username() ?? 'None',
				  }
				: username() ?? 'None';
		},
		packTypeName: props.packTypeName,
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
							<SubmitButton>Save</SubmitButton>
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
