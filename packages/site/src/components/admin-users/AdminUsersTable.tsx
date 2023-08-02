import Table from '@/components/table/Table';
import type { AdminEntity } from '@lil-indigestion-cards/core/user';
import DeleteAdminUserButton from '@/components/admin-users/DeleteAdminUserButton';
import { addingAdminUser, setAddingAdminUser } from '@/lib/client/state';
import { createResource, createSignal } from 'solid-js';
import { api } from '@/constants';
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

export default function AdminUsersTable(props: { users: AdminEntity[]; currentUser: string }) {
	const [adminUsers, { refetch }] = createResource(
		async () => {
			const res = await fetch(api.ADMIN.GET_ALL);
			const data = await res.json();
			return adminUsersSchema.parse(data);
		},
		{ initialValue: props.users }
	);

	const [newUsername, setNewUsername] = createSignal('');
	const newUser = () => ({
		username: (
			<TextInput inputOnly name="username" label="Username" setValue={setNewUsername} />
		),
		actions: (
			<div class="mx-auto w-fit">
				<Form
					action={api.ADMIN.CREATE}
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
	});

	const isCurrentUser = (userId: string) => userId === props.currentUser;
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
			rows={adminUsers()
				.map((user) => ({
					username: user.username,
					actions: isCurrentUser(user.userId)
						? ''
						: {
								element: (
									<div class="m-auto w-fit">
										<DeleteAdminUserButton {...user} onSuccess={refetch} />
									</div>
								),
								value: '',
						  },
				}))
				// @ts-ignore
				.concat(addingAdminUser() === true ? [newUser()] : [])}
		/>
	);
}
