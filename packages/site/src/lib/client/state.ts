import { publicApi } from '@/constants';
import { createSignal } from 'solid-js';

export interface Alert {
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
}

export const [alerts, setAlerts] = createSignal<Alert[]>([]);
export const [totalPackCount, setTotalPackCount] = createSignal(0);
export const [addingAdminUser, setAddingAdminUser] = createSignal(false);
const [_users, setUsers] = createSignal<string[]>([]);
export const users = _users;

let isUsersFetched = false;
export const fetchUsers = () => {
	if (isUsersFetched) return;
	fetch(publicApi.GET_ALL_USERNAMES)
		.then((res) => res.json())
		.then((body) => {
			if (!Array.isArray(body)) throw new Error('Invalid response from server');
			const sorted = body.sort((a, b) => a.localeCompare(b)) as string[];
			setUsers(sorted);
			isUsersFetched = true;
		});
};
