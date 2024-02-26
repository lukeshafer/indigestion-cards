import {
	Router as SolidRouter,
	Route,
	type RouteSectionProps,
	type RouteLoadFuncArgs,
} from '@solidjs/router';
import { isServer } from 'solid-js/web';
import { For, JSX, createEffect, lazy, on } from 'solid-js';
import { QueryClient, QueryClientProvider, createQuery } from '@tanstack/solid-query';
import { PageContext, type PageContextData } from '@/lib/client/context';
import type { Session } from '@lil-indigestion-cards/core/types';

// ROUTES
import { route as indexRoute } from '@/routes';
import { route as allCardsRoute } from '@/routes/card';
import { route as designIdRoute } from '@/routes/card/[designId]';
import { route as usersRoute } from '@/routes/user';
import { route as usernameRoute } from '@/routes/user/[username]';
import { createStore } from 'solid-js/store';
import { trpc } from './trpc/client';
import type { SiteConfig } from '@lil-indigestion-cards/core/db/siteConfig';
import Page from './components/Page';
import type { Path } from './components/Breadcrumbs';

export type RouteOptions<T> = {
	path: string;
	title: (
		data:
			| {
					[K in keyof T]: T[K] | undefined;
			  }
			| undefined
	) => string;
	breadcrumbs:
		| ((
				data:
					| {
							[K in keyof T]: T[K] | undefined;
					  }
					| undefined
		  ) => Path[])
		| null;
	load: (
		args: RouteLoadFuncArgs,
		ssrData?: T
	) => {
		[K in keyof T]: T[K] | undefined;
	};
};

export type RouteComponent<T> = (props: RouteSectionProps<T>) => JSX.Element;

const routes = [
	[lazy(() => import('@/routes')), indexRoute],
	[lazy(() => import('@/routes/card')), allCardsRoute],
	[lazy(() => import('@/routes/card/[designId]')), designIdRoute],
	[lazy(() => import('@/routes/user')), usersRoute],
	[lazy(() => import('@/routes/user/[username]')), usernameRoute],
] as const satisfies Array<[RouteComponent<any>, RouteOptions<any>]>;

const queryClient = new QueryClient();

export default function Router<Data>(props: {
	ssrUrl: string;
	title: string;
	ssrComponent: RouteComponent<Data>;
	ssrRoute: RouteOptions<Data>;
	ssrData: Data;
	siteConfig: SiteConfig;
	session: Session | null;
}) {
	const [config, setConfig] = createStore<PageContextData>({
		session: props.session,
		disableAnimations: false,
		setDisableAnimations: value => {
			setConfig('disableAnimations', value);
		},
		pageProps: {
			...resolveBreadcrumbs(props.ssrRoute.breadcrumbs, props.ssrData),
		},
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
							initialData: props.siteConfig,
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
								component={componentProps => {
									createEffect(() => {
										const title = route.title(componentProps.data);
										if (title && title !== 'Indigestion Cards')
											document.title = title + ' — Indigestion Cards';
										else document.title = 'Indigestion Cards';
									});

									createEffect(
										on(
											() => ({ ...componentProps.data }),
											data => {
												const { breadcrumbs, hideBreadcrumbs } =
													resolveBreadcrumbs(route.breadcrumbs, data);
												setConfig('pageProps', 'breadcrumbs', breadcrumbs);
												setConfig(
													'pageProps',
													'hideBreadcrumbs',
													hideBreadcrumbs
												);
											}
										)
									);
                  if (isServer) {
                    const SSRComponent = props.ssrComponent;
                    return <SSRComponent {...(componentProps as any)} />
                  }
                  else return <Component {...(componentProps as any)} />;
								}}
								load={args =>
									route.load(
										args,
										args.location.pathname === props.ssrUrl
											? (props.ssrData as any)
											: undefined
									)
								}
							/>
						)}
					</For>
					<Route path="*404" component={lazy(() => import('@/routes/404'))} />
				</SolidRouter>
			</QueryClientProvider>
		</PageContext.Provider>
	);
}

function resolveBreadcrumbs<T>(route: RouteOptions<T>['breadcrumbs'], data: T) {
	if (route) {
		const breadcrumbs = route(data);
		return {
			breadcrumbs,
			hideBreadcrumbs: breadcrumbs.length === 0,
		};
	} else {
		return {
			breadcrumbs: undefined,
			hideBreadcrumbs: true,
		};
	}
}
