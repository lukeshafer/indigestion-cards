import { For, on, onMount } from 'solid-js';
import { useViewTransition } from '~/lib/utils';
import { createContextProvider } from '@solid-primitives/context';
import { createStore, produce } from 'solid-js/store';

export type Alert = {
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
};

type AlertProps = {
	alerts: Alert[];
};

type AlertOutput = {
	alerts: () => Alert[];
	deleteAlert: (index: number) => void;
	addAlert: (alert: Alert) => void;
};

export const [AlertsProvider, useAlerts] = createContextProvider<AlertOutput, AlertProps>(
	(props) => {
		const [state, setState] = createStore<{ alerts: Alert[] }>({
			// eslint-disable-next-line solid/reactivity -- this is just the initial setup, and is tracked afterward
			alerts: props.alerts,
		});

		on(
			() => props.alerts,
			(alerts) => setState('alerts', alerts)
		);

		return {
			alerts: () => state.alerts,
			deleteAlert: (index) => {
				const alert = state.alerts[index];
				if (!alert) return;

				// check if alert is in the url search params, if so remove it
				const url = new URL(window.location.href);
				const searchParams = new URLSearchParams(url.search);
				if (searchParams.has('alert') && searchParams.get('alert') === alert.message) {
					searchParams.delete('alert');
					searchParams.delete('type');
					url.search = searchParams.toString();
					window.history.replaceState({}, '', url.toString());
				}

				useViewTransition(() => {
					setState(
						'alerts',
						produce((alerts) => alerts.splice(index, 1))
					);
				});
			},
			addAlert: (alert) =>
				setState(
					'alerts',
					produce((alerts) => alerts.push(alert))
				),
		};
	},
	{
		alerts: () => [],
		deleteAlert: () => {},
		addAlert: () => {},
	}
);

export default function AlertBox() {
	const { alerts } = useAlerts();

	return (
		<div class="max-w-main fixed right-10 top-10 z-50 mx-auto flex w-full flex-col gap-2">
			<ul class="absolute right-0 flex flex-col items-end gap-2 gap-x-5 pt-2">
				<For each={alerts()}>
					{(alert, index) => <Alert index={index()} alert={alert} />}
				</For>
			</ul>
		</div>
	);
}

const alertStyles = {
	success: 'bg-teal-200 text-teal-950',
	error: 'bg-red-200 text-red-950',
	info: 'bg-blue-200 text-blue-950',
	warning: 'bg-yellow-200 text-yellow-950',
} satisfies Record<Alert['type'], string>;

function Alert(props: { index: number; alert: Alert }) {
	const { alerts, deleteAlert } = useAlerts();
	onMount(() => {
		setTimeout(() => deleteAlert(props.index), 15000);
	});
	return (
		<div
			class="flex items-center gap-x-5 rounded p-4"
			style={{ 'view-transition-name': `alert-${alerts().length - props.index}` }}
			classList={{ [alertStyles[props.alert.type]]: true }}>
			<div>{props.alert.message}</div>
			<button onClick={() => deleteAlert(props.index)}>
				<span class="opacity-50">✕</span>
			</button>
		</div>
	);
}
