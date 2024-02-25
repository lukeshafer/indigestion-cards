import { Router as SolidRouter, Route, useBeforeLeave } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import type {
	RouteOptions,
	RouteComponent,
	RouteOptionsData,
} from './data.client';
import type { Data } from './data.server';
import { useViewTransition } from '@/lib/client/utils';
import { lazy } from 'solid-js';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

// ROUTES
import { route as indexRoute } from '@/routes';
import { route as allCardsRoute } from '@/routes/card';
import { route as designIdRoute } from '@/routes/card/[designId]';
// import UsersPage from '@/routes/user';

//const routes = [Index, CardsPage, CardDesignPage];

const Index = lazy(() => import('@/routes'));

const queryClient = new QueryClient();

export default function Router<Key extends keyof Data, Route extends RouteOptions<Key>>(props: {
	ssrUrl: string;
	ssrRoute: Route;
	ssrComponent: RouteComponent<Key, Route>;
	ssrData: RouteOptionsData<Key, Route>;
}) {
	return (
		<QueryClientProvider client={queryClient}>
			<SolidRouter
				url={isServer ? props.ssrUrl : ''}
				root={props => {
					useBeforeLeave(e => {
						e.preventDefault();
						useViewTransition(() => {
							e.retry(true);
						});
					});
					return (
						<>
							<nav class="flex gap-2 bg-black p-3 text-lime-200 underline">
								<a href="/">Home</a>
								<a href="/user">Users</a>
								<a href="/card">Cards</a>
							</nav>
							{props.children}
						</>
					);
				}}>
				<Route
					path={indexRoute.path}
					component={isServer ? props.ssrComponent : Index}
					load={args =>
						indexRoute.load(
							args,
							args.location.pathname === props.ssrUrl ? props.ssrData : undefined
						)
					}
				/>
				<Route
					path={allCardsRoute.path}
					component={isServer ? props.ssrComponent : lazy(() => import('@/routes/card'))}
					load={args =>
						allCardsRoute.load(
							args,
							args.location.pathname === props.ssrUrl ? props.ssrData : undefined
						)
					}
				/>
				<Route
					path={designIdRoute.path}
					component={
						isServer
							? props.ssrComponent
							: lazy(() => import('@/routes/card/[designId]'))
					}
					load={args =>
						designIdRoute.load(
							args,
							args.location.pathname === props.ssrUrl ? props.ssrData : undefined
						)
					}
				/>
				{
					//routes.map(route => (
					//<Route
					//path={route.route}
					//component={route.component}
					//load={args => {
					//if (args.location.pathname === props.ssrUrl) {
					//return props.ssrData as RouteData<typeof route>;
					//}
					////console.log('loading route', route);
					//const resources: Record<string, (() => any) | undefined> = {};
					//for (const key of route.data) {
					//resources[key] = createData(key as keyof RouteData<typeof route>, args);
					//}
					//return new Proxy({} as RouteData<typeof route>, {
					//get: (_, key) => resources[String(key)]?.(),
					//});
					//}}
					///>
					//))
				}
				<Route path="*404" component={lazy(() => import('@/routes/404'))} />
			</SolidRouter>
		</QueryClientProvider>
	);
}
