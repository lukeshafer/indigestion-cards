import { createSignal } from 'solid-js';
import { produce } from 'solid-js/store';
import { useViewTransition } from './utils';

export interface Alert {
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
}

export const [alerts, setAlerts] = createSignal<Alert[]>([]);
export function pushAlert(alert: Alert, noViewTransition?: boolean) {
	const addAlert = () =>
		setAlerts(
			produce(alertsDraft => {
				alertsDraft.unshift(alert);
			})
		);

	if (noViewTransition) {
		addAlert();
		return;
	} else {
		useViewTransition(addAlert);
	}
}

export const [totalPackCount, setTotalPackCount] = createSignal(0);
export const [addingAdminUser, setAddingAdminUser] = createSignal(false);
