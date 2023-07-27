import { api } from '@/constants';
import { createStore } from 'solid-js/store';
import { createSignal, createResource } from 'solid-js';

interface Alert {
	text: string;
	type: 'success' | 'error' | 'warning' | 'info';
}

export const [alerts, setAlerts] = createStore<Alert[]>([]);

export const [totalPackCount, { refetch: refetchTotalPackCount }] = createResource(async () => {
	const response = await fetch(api.PACK_COUNT);
	if (!response.ok) return 0;
	const responseBody = await response.json();
	if (!responseBody.packCount || typeof responseBody.packCount !== 'number') return 0;
	return responseBody.packCount as number;
});
