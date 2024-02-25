import {
	Router as SolidRouter,
	Route,
	useBeforeLeave,
	type RouteSectionProps,
	type RouteLoadFuncArgs,
} from '@solidjs/router';
import { isServer } from 'solid-js/web';
import { useViewTransition } from '@/lib/client/utils';
import { For, JSX, lazy } from 'solid-js';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { SessionContext } from '@/lib/client/context';
import type { Session } from '@lil-indigestion-cards/core/types';

// ROUTES
import Index, { route as indexRoute } from '@/routes';
import CardsPage, { route as allCardsRoute } from '@/routes/card';
import CardDesignPage, { route as designIdRoute } from '@/routes/card/[designId]';
import UsersPage, { route as usersRoute } from '@/routes/user';
import UserPage, { route as usernameRoute } from '@/routes/user/[username]';

export type RouteOptions<T> = {
	path: string;
	load: (
		args: RouteLoadFuncArgs,
		ssrData?: T
	) => {
		[K in keyof T]: T[K] | undefined;
	};
};

export type RouteComponent<T> = (props: RouteSectionProps<T>) => JSX.Element;

const routes = [
	[Index, indexRoute],
	[CardsPage, allCardsRoute],
	[CardDesignPage, designIdRoute],
	[UsersPage, usersRoute],
  [UserPage, usernameRoute],
] as const;

const queryClient = new QueryClient();

export default function Router<Data>(props: {
	ssrUrl: string;
	ssrComponent: RouteComponent<Data>;
	ssrData: Data;
	session: Session | null;
}) {
	return (
		<SessionContext.Provider value={props.session}>
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
					<For each={routes}>
						{([Component, route]) => (
							<Route
								path={route.path}
								component={Component}
								load={args =>
									route.load(
										args,
										isServer && args.location.pathname === props.ssrUrl
											? props.ssrData
											: undefined
									)
								}
							/>
						)}
					</For>
					<Route path="*404" component={lazy(() => import('@/routes/404'))} />
				</SolidRouter>
			</QueryClientProvider>
		</SessionContext.Provider>
	);
}
