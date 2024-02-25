import { PageHeader, PageTitle } from '@/components/text';
import UsersTable from '@/components/user/UsersTable';
import { client, createData } from '@/data/data.client';
import { Show } from 'solid-js';

export default client.defineRoute('/user', ['users', 'preorders'], props => {
  const users = createData('users', props);
  const preorders = createData('preorders', props);

  return (
    <>
      <PageHeader>
        <PageTitle>Users</PageTitle>
      </PageHeader>
      <div class="mx-auto max-w-2xl">
        <Show when={users()}>
          {users => <UsersTable users={users()} preorders={preorders()} />}
        </Show>
      </div>
    </>
  );
});
