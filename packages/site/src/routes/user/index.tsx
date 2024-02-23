import { PageHeader, PageTitle } from '@/components/text';
import UsersTable from '@/components/user/UsersTable';
import type { Preorder } from '@lil-indigestion-cards/core/db/preorders';
import type { User } from '@lil-indigestion-cards/core/db/users';
import type { ParentProps } from 'solid-js';

export default function Users(
	props: ParentProps<{
		data: {
			users: Array<User>;
			preorders: Array<Preorder>;
		};
	}>
) {
	return (
		<>
			<PageHeader>
				<PageTitle>Users</PageTitle>
			</PageHeader>
			<div class="mx-auto max-w-2xl">
        <UsersTable {...props.data} />
      </div>
		</>
	);
}
