import { createClient } from './lib/client';
import type { Data } from './data.server';
import type { DataOutput } from './lib/utils';
import {
	createAsync,
	type RouteLoadFunc,
	type RouteLoadFuncArgs,
	type RouteSectionProps,
} from '@solidjs/router';
import { isServer } from 'solid-js/web';
import type { JSX } from 'solid-js';

export const client = createClient<Data>();
export type Route = ReturnType<(typeof client)['defineRoute']>;
export type RouteData<R extends Route> = {
	[Key in R['data'][number]]: DataOutput<Data, Key>;
};

export function createData<Key extends keyof Data>(
	data: Key,
	props: RouteSectionProps
): () => DataOutput<Data, Key> | undefined {
	const serverData = props.data?.[data];
	return createAsync(() => (isServer ? serverData : client.get(data, props.params)), {
		initialValue: serverData,
	});
}

export function createRoute<Key extends keyof Data>(
	_options: RouteOptions<Key>,
	component: (
		props: RouteSectionProps<{ [K in Key]: Awaited<ReturnType<Data[K]['load']>> }>
	) => JSX.Element
) {
	return component;
}

export function createRouteOptions<Key extends keyof Data>(options: RouteOptions<Key>) {
	return {
		...options,
		createRoute: (
			component: (
				props: RouteSectionProps<ReturnType<RouteOptions<Key>['load']>>
			) => JSX.Element
		) => component,
	};
}

export type RouteComponent<Key extends keyof Data, Options extends RouteOptions<Key>> = (
	props: RouteSectionProps<ReturnType<Options['load']>>
) => JSX.Element;

export type RouteOptionsData<Key extends keyof Data, R extends RouteOptions<Key>> = {
	[Key in R['data'][number]]: DataOutput<Data, Key>;
};

export type RouteOptions<Keys extends keyof Data> = {
	path: string;
	data: Array<Keys>;
	load: (
		args: RouteLoadFuncArgs,
		ssrData?:
			| {
					[K in Keys]: DataOutput<Data, K>;
			  }
			| undefined
	) => {
		[K in Keys]: DataOutput<Data, K> | undefined;
	};
};

// createData('card', props) =>
// createAsync(() => client.get('card', { designId: props.params.designId }), { initialValue: props.data?.card })
