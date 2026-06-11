import { createStore, produce } from 'solid-js/store';
import { useViewTransition } from './utils';

export interface Alert {
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
}

export const [alerts, setAlerts] = createStore<Alert[]>([]);
export function pushAlert(alert: Alert, noViewTransition?: boolean) {
	const addAlert = () => setAlerts(produce(alertsDraft => alertsDraft.unshift(alert)));

	if (noViewTransition) {
		addAlert();
		return;
	} else {
		useViewTransition(addAlert);
	}
}
