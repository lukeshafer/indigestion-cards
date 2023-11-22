import AlertBox, { AlertsProvider } from './AlertBox';
import Breadcrumbs, { BreadcrumbProps } from './Breadcrumbs';
import { type ParentProps, Show } from 'solid-js';
import { PageContextProvider } from '~/lib/page-context';
import { useLocation } from 'solid-start';
import Header from './Header';

export default function PageLayout(
	props: ParentProps<{
		class?: string;
		noHeader?: boolean;
		wide?: boolean;
		hideBreadcrumbs?: boolean;
	}>
) {
	const location = useLocation();
	const paths = () =>
		location.pathname.split('/').map((location, index, arr) => ({
			label: location.charAt(0).toUpperCase() + location.slice(1),
			href: index + 1 < arr.length ? location : undefined,
			current: index + 1 === arr.length,
		})) satisfies BreadcrumbProps[];

	const Footer = () => <footer>ffffff{/* TODO: create header component */}</footer>;

	return (
		<div
			class="grid h-[100svh] grid-cols-1 overflow-hidden md:grid-cols-[max-content_1fr]"
			id="page-layout-wrapper">
			{/*<AdminOnly> <AdminPanel /> </AdminOnly> */}
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
								<Breadcrumbs paths={paths()} />
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
							{props.children}
						</main>
						<div id="card-preview"></div>
						<Footer />
					</div>
				</PageContextProvider>
			</AlertsProvider>
		</div>
	);
}
