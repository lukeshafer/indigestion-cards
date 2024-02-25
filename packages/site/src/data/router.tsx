import { Router as SolidRouter, Route, useBeforeLeave } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import { type Route as RouteType, type RouteData, createData } from './data.client';
import { useViewTransition } from '@/lib/client/utils';
import { lazy } from 'solid-js';

// ROUTES
import Index from '@/routes';
import CardsPage from '@/routes/card';
import CardDesignPage from '@/routes/card/[designId]';
import UsersPage from '@/routes/user';

const routes: Array<RouteType> = [Index, CardsPage, CardDesignPage, UsersPage];

export default function Router<R extends RouteType>(props: {
	ssrUrl: string;
	ssrRoute: R;
	ssrData: RouteData<R>;
}) {
	return (
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
			{routes.map(route => {
				return (
					<Route
						path={route.route}
						component={route.component}
						load={args => {
							if (isServer && route.route === props.ssrRoute?.route) {
								return props.ssrData as RouteData<typeof route>;
							}

							const resources: Record<string, (() => any) | undefined> = {};
							for (const key in route.data) {
								resources[key] = createData(key as keyof RouteData<typeof route>, args);
							}

							return new Proxy(
								{} as RouteData<typeof route>,
								{
									get: (_, key) => resources[String(key)]?.(),
								}
							);
						}}
					/>
				);
			})}
			<Route path="*404" component={lazy(() => import('@/routes/404'))} />
		</SolidRouter>
	);
}
