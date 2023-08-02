import { publicApi, routes } from '@/constants';
import { Form, TextInput } from '@/components/form/Form';
import { Index, createSignal } from 'solid-js';

export default function () {
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
			setUsers(usernames);
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
				<datalist id="users">
					{users().map((username) => (
						<option value={username} />
					))}
				</datalist>
			</Form>
		</div>
	);
}