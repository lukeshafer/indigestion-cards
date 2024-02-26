import { useBeforeLeave, type RouteSectionProps } from '@solidjs/router';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from './Header';
import Footer from './Footer';
import AlertBox from '@/components/AlertBox';
import LoadingBar from '@/components/LoadingBar';
import { useConfig } from '@/lib/client/context';
import type { SiteConfig } from '@lil-indigestion-cards/core/db/siteConfig';
import { Show } from 'solid-js';
import { transitionname, useViewTransition } from '@/lib/client/utils';
import type { TwitchUser } from '@lil-indigestion-cards/core/lib/twitch';
() => void transitionname;

export default function Page(
	props: RouteSectionProps<{
		siteConfig: SiteConfig;
		twitchData: TwitchUser;
	}>
) {
	useBeforeLeave(e => {
		e.preventDefault();
		useViewTransition(() => {
			e.retry(true);
		});
	});

	const config = useConfig();
	const initialAlerts = () =>
		config.session?.type === 'admin' ? props.data?.siteConfig.messages || [] : [];

	return (
		<>
			<div
				class="grid h-[100dvh] grid-cols-1 overflow-hidden md:grid-cols-[max-content_1fr]"
				id="page-layout-wrapper">
				<div
					class="relative flex flex-col overflow-y-scroll bg-gray-50 md:col-start-2 dark:bg-gray-950"
					id="page-scroll-wrapper">
					<LoadingBar />
					<Show when={!config.pageProps.noHeader && props.data?.siteConfig}>
						{siteConfig => (
							<Header
								logo={config.pageProps.logo}
								siteConfig={siteConfig()}
								twitchData={props.data?.twitchData}
							/>
						)}
					</Show>
					<AlertBox alerts={initialAlerts()} />
					<Show when={!config.pageProps.hideBreadcrumbs}>
						<div class="max-w-main mx-auto w-full">
							<Breadcrumbs
								path={config.pageProps.breadcrumbs ?? []}
								currentPath={props.location.pathname}
							/>
						</div>
					</Show>
					<main
						use:transitionname={config.pageProps.wide ? undefined : 'main'}
						classList={{
							'max-w-main': !config.pageProps.wide,
							[config.pageProps.class ?? '']: true,
							'p-3': !config.pageProps.noHeader,
						}}
						class="@container/main z-0 col-start-2 mx-auto mb-8 w-full flex-1">
						{props.children}
					</main>
					<div id="card-preview"></div>
					<Footer />
				</div>
			</div>
		</>
	);
}
