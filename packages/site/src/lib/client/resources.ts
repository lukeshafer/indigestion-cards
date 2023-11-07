import { createResource, createSignal } from 'solid-js';
import { publicApi } from '@/constants';

export const [canFetchUsers, setCanFetchUsers] = createSignal(false);
export const fetchUsers = () => setCanFetchUsers(true);

export const [users] = createResource(canFetchUsers, async (canFetchUsers: boolean) => {
	if (!canFetchUsers) return;
	const response = await fetch(publicApi.GET_ALL_USERNAMES);
	const usernames = await response.json();
	if (!Array.isArray(usernames)) throw new Error('Invalid response from server');
	return usernames.sort((a, b) => a.localeCompare(b)) as string[];
});
