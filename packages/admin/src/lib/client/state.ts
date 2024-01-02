import { createSignal } from 'solid-js';

export interface Alert {
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
}

export const [alerts, setAlerts] = createSignal<Alert[]>([]);
export const [totalPackCount, setTotalPackCount] = createSignal(0);
export const [addingAdminUser, setAddingAdminUser] = createSignal(false);
