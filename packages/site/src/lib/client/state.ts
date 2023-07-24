import { createStore } from 'solid-js/store';

interface Alert {
	text: string;
	type: 'success' | 'error' | 'warning' | 'info';
}

export const [alerts, setAlerts] = createStore<Alert[]>([]);
