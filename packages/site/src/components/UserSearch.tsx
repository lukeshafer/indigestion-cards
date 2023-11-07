import { publicApi } from '@/constants';
import { Form, TextInput } from '@/components/form/Form';
import { For, } from 'solid-js';
import { users, fetchUsers } from '@/lib/client/state';
import SearchIcon from './icons/SearchIcon';

export default function UserSearch() {
	return (
		<div
			class="relative w-40 md:w-auto"
			onFocus={fetchUsers}
			onMouseOver={fetchUsers}
			style={{ 'view-transition-name': 'user-search-bar' }}>
			<Form action={publicApi.SEARCH} method="get">
				<TextInput
					list="users"
					name="username"
					label="Search Users"
					inputOnly
					autocomplete="off"
				/>
				<button
					type="submit"
					class="absolute right-0 top-0 h-full bg-white fill-gray-800 px-1 text-gray-500 dark:bg-black dark:fill-gray-300">
					<span class="sr-only">Search</span>
					<SearchIcon size="1.4rem" />
				</button>
				<datalist id="users">
					<For each={users()}>{(username) => <option value={username} />}</For>
				</datalist>
			</Form>
		</div>
	);
}
