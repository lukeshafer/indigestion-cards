import { RouteSectionProps, Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { createContext } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { Suspense } from 'solid-js';
import './app.css';

export default function App() {
	return (
		<Router root={Root}>
			<FileRoutes />
		</Router>
	);
}

export const PageContext = createContext({
	wide: false,
	class: '',
  logo: 'default' as 'default' | 'tongle'
});

function Root(props: RouteSectionProps) {
	const context = createMutable(PageContext.defaultValue);

	return (
		<PageContext.Provider value={context}>
			<div
				class="grid h-[100dvh] grid-cols-1 overflow-hidden md:grid-cols-[max-content_1fr]"
				id="page-layout-wrapper">
				<div
					class="relative flex flex-col overflow-y-scroll bg-gray-50 md:col-start-2 dark:bg-gray-950"
					id="page-scroll-wrapper">
					{/* 
        <LoadingBar client:load transition:persist transition:name="loadingbar" /> 
			{noHeader ? null : <Header {logo} />}
			<AlertBox client:load {alerts} />
			{
				hideBreadcrumbs ? null : (
					<div class="max-w-main mx-auto w-full">
						<Breadcrumbs path={breadcrumbs ?? []} currentPath={Astro.url.pathname} />
					</div>
				)
			}
        */}
					<main
						style={{ 'view-transition-name': context.wide ? undefined : 'main' }}
						classList={{
							[context.class]: true,
						}}
						class="@container/main data-[wide]:max-w-main z-0 col-start-2 mx-auto mb-8 w-full flex-1 data-[noheader]:p-3">
						<Suspense>{props.children}</Suspense>
					</main>
					<div id="card-preview"></div>
					{/* <Footer /> */}
				</div>
			</div>
		</PageContext.Provider>
	);
}
