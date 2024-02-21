import type { JSX } from 'solid-js';
import type { DataKey, DataOutput } from '../routes.config.ts';
import type { RouteSectionProps } from '@solidjs/router';

export function defineRoute<R extends string, K extends Array<DataKey>>(
	route: R,
	data: K,
	component: (
		props: RouteSectionProps<{
			[Key in K[number]]: DataOutput<Key>;
		}>
	) => JSX.Element
) {
	return { route, data, component };
}
