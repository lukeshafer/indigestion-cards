import {
	Router as SolidRouter,
	Route,
	type RouteSectionProps,
	type RouteLoadFuncArgs,
} from '@solidjs/router';
import { isServer } from 'solid-js/web';
import { For, JSX, createEffect, on } from 'solid-js';
import { QueryClient, QueryClientProvider, createQuery } from '@tanstack/solid-query';
import { PageContext, type PageContextData } from '@/lib/client/context';
import type { Session } from '@lil-indigestion-cards/core/types';

// ROUTES
import Index, { route as indexRoute } from '@/routes';
import CardsPage, { route as allCardsRoute } from '@/routes/card';
import CardDesignPage, { route as designIdRoute } from '@/routes/card/[designId]';
import UsersPage, { route as usersRoute } from '@/routes/user';
import UserPage, { route as usernameRoute } from '@/routes/user/[username]';
import { createStore } from 'solid-js/store';
import { trpc } from './trpc/client';
import type { SiteConfig } from '@lil-indigestion-cards/core/db/siteConfig';
import Page from './components/Page';
import type { Path } from './components/Breadcrumbs';

export type RouteOptions<T> = {
	path: string;
	title: (data: T) => string;
	breadcrumbs: ((data: T) => Path[]) | null;
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
] as const satisfies Array<[RouteComponent<any>, RouteOptions<any>]>;

const queryClient = new QueryClient();

export default function Router<Data>(props: {
	ssrUrl: string;
	title: string;
	ssrComponent: RouteComponent<Data>;
	ssrData: Data & {
		siteConfig: SiteConfig;
	};
	session: Session | null;
}) {
	const [config, setConfig] = createStore<PageContextData>({
		session: props.session,
		disableAnimations: false,
		setDisableAnimations: value => {
			setConfig('disableAnimations', value);
		},
		pageProps: {},
		setPageProps: value => {
			setConfig('pageProps', value);
		},
		title: props.title,
		setTitle: value => {
			setConfig('title', value);
		},
	});

	createEffect(() => {
		if (config.title && config.title !== 'Indigestion Cards')
			document.title = config.title + ' — Indigestion Cards';
		else document.title = 'Indigestion Cards';
	});

	return (
		<PageContext.Provider value={config}>
			<QueryClientProvider client={queryClient}>
				<SolidRouter
					url={isServer ? props.ssrUrl : ''}
					rootLoad={() => {
						const siteConfig = createQuery(() => ({
							queryKey: ['siteConfig'],
							queryFn: () => trpc.siteConfig.query(),
							initialData: props.ssrData?.siteConfig,
						}));

						const twitchData = () => {
							const username = config.session?.properties.username;
							if (username)
								return createQuery(() => ({
									queryKey: ['twitchData', username],
									queryFn: () =>
										trpc.twitch.userByLogin.query({
											login: username ?? '',
										}),
									initialData:
										'twitchData' in props.ssrData
											? props.ssrData?.twitchData
											: undefined,
								}));
							else return undefined;
						};

						return {
							get siteConfig() {
								return siteConfig.data;
							},
							get twitchData() {
								return twitchData()?.data;
							},
						};
					}}
					root={Page}>
					<For each={routes}>
						{([Component, route]) => (
							<Route
								path={route.path}
								component={props => {
									createEffect(() => {
										const title = route.title(props.data);
										if (title && title !== 'Indigestion Cards')
											document.title = title + ' — Indigestion Cards';
										else document.title = 'Indigestion Cards';
									});

									createEffect(
										on(
											() => props.data,
											data => {
												if (route.breadcrumbs) {
													const breadcrumbs = route.breadcrumbs(data);
													setConfig(
														'pageProps',
														'breadcrumbs',
														breadcrumbs
													);
													setConfig('pageProps', 'hideBreadcrumbs', breadcrumbs.length === 0);
												} else {
                          setConfig('pageProps', 'breadcrumbs', undefined);
                          setConfig('pageProps', 'hideBreadcrumbs', true);
                        }
											}
										)
									);
									return <Component {...props} />;
								}}
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
				</SolidRouter>
			</QueryClientProvider>
		</PageContext.Provider>
	);
}
