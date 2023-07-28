import Table from '@/components/table/Table';
import type { AdminEntity } from '@lil-indigestion-cards/core/user';
import DeleteAdminUserButton from '@/components/admin-users/DeleteAdminUserButton';

export default function AdminUsersTable(props: { users: AdminEntity[]; currentUser: string }) {
	const isCurrentUser = (userId: string) => userId === props.currentUser;
	return (
		<Table
			id="admin-users-table"
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
				},
			]}
			rows={props.users.map((user) => ({
				username: user.username,
				actions: isCurrentUser(user.userId) ? (
					''
				) : (
					<div class="w-fit m-auto">
						<DeleteAdminUserButton {...user} />
					</div>
				),
			}))}
		/>
	);
}
