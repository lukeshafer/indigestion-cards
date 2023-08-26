import { For, onMount } from 'solid-js';
import { alerts, setAlerts, type Alert } from '@/lib/client/state';
import { useViewTransition } from '@/lib/client/utils';

export default function AlertBox(props: { alerts: Alert[] }) {
	setAlerts(props.alerts);

	return (
		<div>
			<For each={alerts()}>{(alert, index) => <Alert index={index()} {...alert} />}</For>
		</div>
	);
}

const alertStyles = {
	success: 'bg-teal-200 text-teal-950',
	error: 'bg-red-200 text-red-950',
	info: 'bg-blue-200 text-blue-950',
	warning: 'bg-yellow-200 text-yellow-950',
} satisfies Record<Alert['type'], string>;

function Alert(
	props: {
		index: number;
	} & Alert
) {
	const deleteAlert = () => {
		setAlerts((alerts) => alerts.filter((_, i) => i !== props.index));
	};
	return (
		<div
			class="flex items-center gap-x-5 p-4"
			classList={{ [alertStyles[props.type]]: true }}>
			<button onclick={() => useViewTransition(deleteAlert)}>
				<span class="opacity-50">✕</span>
			</button>
			<div>{props.message}</div>
		</div>
	);
}
