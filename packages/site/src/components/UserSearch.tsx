import { publicApi } from '@/constants';
import { Form, TextInput } from '@/components/form/Form';
import { createSignal } from 'solid-js';
import { AiOutlineSearch } from 'solid-icons/ai';

export default function UserSearch() {
	const [users, setUsers] = createSignal<string[]>([]);
	const [isFetching, setIsFetching] = createSignal(false);

	// ts-expect-error - This function IS used
	function searchDirective(el: HTMLElement) {
		const fetchUsernames = async () => {
			if (users().length > 0 || isFetching()) return;
			setIsFetching(true);
			const response = await fetch(publicApi.GET_ALL_USERNAMES);
			const usernames = await response.json();
			if (!Array.isArray(usernames)) throw new Error('Invalid response from server');
			setUsers(usernames.sort((a, b) => a.localeCompare(b)));
			setIsFetching(false);

			el.removeEventListener('focus', fetchUsernames);
			el.removeEventListener('mouseover', fetchUsernames);
		};

		el.addEventListener('focus', fetchUsernames, { once: true, capture: true });
		el.addEventListener('mouseover', fetchUsernames, { once: true, capture: true });
	}

	return (
		<div
			class="relative w-40 md:w-auto"
			use:searchDirective
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
					class="absolute right-0 top-0 h-full bg-white px-1 text-gray-500">
					<span class="sr-only">Search</span>
					<AiOutlineSearch size="1.4rem" />
				</button>
				<datalist id="users">
					{users().map((username) => (
						<option value={username} />
					))}
				</datalist>
			</Form>
		</div>
	);
}
