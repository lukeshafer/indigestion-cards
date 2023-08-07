import { publicApi, routes } from '@/constants';
import { Form, TextInput } from '@/components/form/Form';
import { Index, createSignal } from 'solid-js';
import { AiOutlineSearch } from 'solid-icons/ai';

export default function UserSearch() {
	const [users, setUsers] = createSignal<string[]>([]);
	const [searchResults, setSearchResults] = createSignal<string[]>([]);
	const [isFetching, setIsFetching] = createSignal(false);
	const [focusedIndex, setFocusedIndex] = createSignal(-1);

	const searchDirective = (el: HTMLElement) => {
		const fetchUsernames = async () => {
			console.log('fetching usernames');
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
	};

	return (
		<div class="relative" use:searchDirective>
			<Form action={publicApi.SEARCH} method="get">
				<TextInput
					list="users"
					name="username"
					label="Search Usernames"
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
