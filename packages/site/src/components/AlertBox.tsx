import { For } from 'solid-js';
import { alerts, setAlerts } from '@/lib/client/state';

export default function AlertBox() {
	return (
		<div class="sticky top-0">
			<For each={alerts}>
				{(alert, index) => <Alert index={index()} text={alert.text} type={alert.type} />}
			</For>
		</div>
	);
}

const alertStyles = {
	success: 'bg-teal-200 text-teal-950',
	error: 'bg-red-200 text-red-950',
	info: 'bg-blue-200 text-blue-950',
	warning: 'bg-yellow-200 text-yellow-950',
} satisfies Record<(typeof alerts)[number]['type'], string>;

function Alert(
	props: {
		index: number;
	} & (typeof alerts)[number]
) {
	const deleteAlert = () => {
		setAlerts((alerts) => alerts.filter((_, i) => i !== props.index));
	};
	return (
		<div
			class="view-transition-alert flex items-center justify-between p-4"
			classList={{ [alertStyles[props.type]]: true }}>
			<div>{props.text}</div>
			<button
				class="text-xl"
				onclick={deleteAlert}>
				X
			</button>
		</div>
	);
}
