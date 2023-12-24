import AlertBox, { AlertsProvider } from './AlertBox';
import Breadcrumbs from './Breadcrumbs';
import { type ParentProps, Show, Suspense } from 'solid-js';
import { PageContextProvider } from '~/lib/page-context';
import Header from './Header';
import Footer from './Footer';
import { MetaProvider } from '@solidjs/meta';
import { useBeforeLeave } from '@solidjs/router';

export default function PageLayout(
	props: ParentProps<{
		class?: string;
		noHeader?: boolean;
		wide?: boolean;
		hideBreadcrumbs?: boolean;
	}>
) {
	useBeforeLeave((e) => {
		if (document.startViewTransition) {
			e.preventDefault();
			document.startViewTransition(() => {
				e.retry(true);
			});
		}
	});

	return (
		<div
			class="grid h-[100svh] grid-cols-1 overflow-hidden md:grid-cols-[max-content_1fr]"
			id="page-layout-wrapper">
			<MetaProvider>
				<AlertsProvider alerts={[]}>
					<PageContextProvider>
						<div
							class="relative flex flex-col overflow-y-scroll bg-gray-50 dark:bg-gray-950 md:col-start-2"
							id="page-scroll-wrapper">
							{props.noHeader ? null : <Header />}
							{
								//<data-lists></data-lists>
							}
							<AlertBox />
							<Show when={!props.hideBreadcrumbs}>
								<div class="max-w-main mx-auto w-full">
									<Breadcrumbs />
								</div>
							</Show>
							<main
								style={{ 'view-transition-name': props.wide ? undefined : 'main' }}
								classList={{
									'max-w-main': !props.wide,
									[props.class ?? '']: true,
									'p-3': !props.noHeader,
								}}
								class="@container/main z-0 col-start-2 mx-auto mb-8 w-full flex-1">
								<Suspense fallback="loading">{props.children}</Suspense>
							</main>
							<div id="card-preview"></div>
							<Footer />
						</div>
					</PageContextProvider>
				</AlertsProvider>
			</MetaProvider>
		</div>
	);
}
