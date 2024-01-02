import Table, { type Cell } from '@/components/table/Table';
import type { Admin } from '@lil-indigestion-cards/core/db/admins';
import DeleteAdminUserButton from '@/components/admin-users/DeleteAdminUserButton';
import { addingAdminUser, setAddingAdminUser } from '@/lib/client/state';
import { createMemo, createResource, createSignal } from 'solid-js';
import { API } from '@/constants';
import { z } from 'astro/zod';
import { TextInput, SubmitButton, Form } from '@/components/form/Form';

const adminUsersSchema = z.array(
	z.object({
		userId: z.string(),
		username: z.string(),
		isStreamer: z.boolean(),
	})
);

export function AddAdminButton() {
	return (
		<SubmitButton onClick={() => setAddingAdminUser((adding) => !adding)}>
			{addingAdminUser() ? 'Cancel' : 'New Admin'}
		</SubmitButton>
	);
}

export default function AdminUsersTable(props: { users: Admin[]; currentUser: string }) {
	const [adminUsers, { refetch }] = createResource(
		() =>
			fetch(API.ADMIN_USER)
				.then((res) => res.json())
				.then((data) => adminUsersSchema.parse(data)),
		// eslint-disable-next-line solid/reactivity
		{ initialValue: props.users }
	);

	const [newUsername, setNewUsername] = createSignal('');
	const newUser = () => ({
		username: {
			element: (
				<TextInput
					inputOnly
					name="username"
					label="Username"
					value={newUsername()}
					onChange={(e) => setNewUsername(e.currentTarget.value)}
				/>
			),
			value: newUsername(),
		} as Cell,
		actions: {
			element: (
				<div class="mx-auto w-fit">
					<Form
						action={API.ADMIN_USER}
						method="post"
						onsuccess={() => {
							refetch();
							setAddingAdminUser(false);
						}}>
						<input type="hidden" name="username" value={newUsername()} />
						<SubmitButton>Add</SubmitButton>
					</Form>
				</div>
			),
			value: '',
		},
	});

	const isCurrentUser = (userId: string) => userId === props.currentUser;

	const userRows = createMemo(() =>
		adminUsers()
			.map((user) => ({
				username: user.username as Cell,
				actions: isCurrentUser(user.userId)
					? ''
					: ({
							element: (
								<div class="m-auto w-fit">
									<DeleteAdminUserButton {...user} onSuccess={refetch} />
								</div>
							),
							value: '',
					  } as Cell),
			}))
			.concat(addingAdminUser() === true ? [newUser()] : [])
	);

	return (
		<Table
			id="admin-users-table"
			search={{
				label: 'Search',
				column: 'username',
			}}
			columns={[
				{
					name: 'username',
					label: 'Username',
					width: '65%',
					align: 'left',
					font: 'title',
				},
				{
					name: 'actions',
					label: 'Actions',
					sort: false,
				},
			]}
			rows={userRows()}
		/>
	);
}
