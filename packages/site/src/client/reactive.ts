import { createEffect, createSignal, on, type Accessor, type Setter } from 'solid-js';

export function createMutableProp<T>(prop: () => T): [Accessor<T>, Setter<T>] {
	const [signal, setSignal] = createSignal<T>(prop());

	createEffect(
    // when the prop itself updates, we want to display its latest version
    // the user can set the signal for optimistic updates
		on(prop, newValue => {
			setSignal(() => newValue);
		})
	);

	return [signal, setSignal] as const;
}
