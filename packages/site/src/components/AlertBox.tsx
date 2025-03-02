import { For, createEffect, onMount } from 'solid-js';
import { alerts, setAlerts, type Alert } from '@site/client/state';
import { useViewTransition } from '@site/client/utils';

export default function AlertBox(props: { alerts: Alert[] }) {
	setAlerts(props.alerts);
	createEffect(() => setAlerts(props.alerts));

	return (
		<div class="max-w-main fixed top-10 right-10 z-50 mx-auto flex w-full flex-col gap-2">
			<ul class="absolute right-0 flex flex-col items-end gap-2 gap-x-5 pt-2">
				<For each={alerts()}>
					{(alert, index) => (
						<Alert index={index()} length={alerts().length} {...alert} />
					)}
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

function Alert(
	props: {
		index: number;
		length: number;
	} & Alert
) {
	const deleteAlert = () => {
		// check if alert is in the url search params, if so remove it
		const url = new URL(window.location.href);
		const searchParams = new URLSearchParams(url.search);
		if (searchParams.has('alert') && searchParams.get('alert') === props.message) {
			searchParams.delete('alert');
			searchParams.delete('type');
			url.search = searchParams.toString();
			window.history.replaceState({}, '', url.toString());
		}

		// This function is called by a user event, so it does not need to be reactive
		// eslint-disable-next-line solid/reactivity
		useViewTransition(() => setAlerts((alerts) => alerts.filter((_, i) => i !== props.index)));
	};

	onMount(() => {
		setTimeout(deleteAlert, 15000);
	});
	return (
		<div
			class="flex items-center gap-x-5 rounded p-4"
			style={{ 'view-transition-name': `alert-${props.length - props.index}` }}
			classList={{ [alertStyles[props.type]]: true }}>
			<div>{props.message}</div>
			<button onClick={() => deleteAlert()}>
				<span class="opacity-50">✕</span>
			</button>
		</div>
	);
}
