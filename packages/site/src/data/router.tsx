import { Router as SolidRouter, Route, cache, createAsync } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import { client, type Route as RouteType } from './data.client';

const routes: Array<RouteType> = [];

export default function Router(props: {
	ssrUrl: string;
	//ssrCtx: ClientContextProps;
	ssrRoute: {
		pattern: string;
		data: any;
	};
}) {
	return (
		<SolidRouter url={isServer ? props.ssrUrl : ''}>
			{routes.map(route => {
				return (
					<Route
						path={route.route}
						component={route.component}
						load={
							args => {
								if (route.route === props.ssrRoute?.pattern) {
									//console.log(props.ssrRoute.data);
									return props.ssrRoute.data;
								}

								const resources = new Map<string, any>(
									route.data.map(key => {
										const cacheFn = cache(
											() =>
												client.get(
													// @ts-expect-error -- it's fiiiiiine
													key,
													args.params
												),
											key
										);
										const data = createAsync(() => cacheFn());
										return [key, data] as const;
									})
								);

								const data = new Proxy(
									{} as Record<(typeof route.data)[number], any>,
									{
										get(_, prop) {
											return resources.get(String(prop))?.();
										},
									}
								);
								return data;
							}
							// TODO: add resource proxy/getter to fetch all the data
						}
					/>
				);
			})}
			<Route path="*404" component={() => <div>404</div>} />
		</SolidRouter>
	);
}
