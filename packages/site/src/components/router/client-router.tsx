import { Router as SolidRouter, Route, cache, createAsync } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import Page from '@/components/Page';
import { ClientContext, type ClientContextProps } from '@/client/context';
import { routes } from '@/routes';
import type {} from '@/data.server';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { client } from '@/data.client';

const queryClient = new QueryClient();

export default function Router(props: {
	ssrUrl: string;
	ssrCtx: ClientContextProps;
	ssrRoute: {
		pattern: string;
		data: any;
	};
}) {
	return (
		<div>
			<ClientContext.Provider value={props.ssrCtx}>
				<QueryClientProvider client={queryClient}>
					<SolidRouter url={isServer ? props.ssrUrl : ''} root={Page}>
						{routes.map(route => {
							return (
								<Route
									path={route.route}
									component={route.component}
									load={
										(args) => {
											if (route.route === props.ssrRoute?.pattern) {
												//console.log(props.ssrRoute.data);
												return props.ssrRoute.data;
											}

											const resources = new Map(
												route.data.map(key => {
													const cacheFn = cache(
														() => client.get(key, args.params),
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
														return resources.get(prop)?.();
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
				</QueryClientProvider>
			</ClientContext.Provider>
		</div>
	);
}
