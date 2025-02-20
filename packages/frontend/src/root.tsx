/* @refresh reload */
import { render } from 'solid-js/web';
import { Route, Router, useLocation, type RouteSectionProps } from '@solidjs/router';
import { createContext, Show, type Component } from 'solid-js';
import './index.css';
import Home from './routes/index';
import AlertBox from './components/AlertBox';
import { createMutable } from 'solid-js/store';
import Breadcrumbs from './components/Breadcrumbs';
import { Footer } from './components/Footer';

const root = document.getElementById('root');

if (!root) {
	throw new Error('Root div not found.');
}

render(
	() => (
		<Router root={PageRoot}>
			<Route path="/" component={Home} />
		</Router>
	),
	root
);

type RootState = {
  noHeader: boolean;
  alerts: Array<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>
    breadcrumbs: Array<{label: string; href?: string }>
  wide?: boolean;
}

const RootContext = createContext<RootState>({
  noHeader: false,
  alerts: [],
  breadcrumbs: [],
  wide: false
});

const PageRoot: Component<RouteSectionProps> = props => {
  const state = createMutable<RootState>(RootContext.defaultValue)
  const location = useLocation()
return ((

					<div
						class="grid h-[100dvh] grid-cols-1 overflow-hidden md:grid-cols-[max-content_1fr]"
						>
						<div
							class="scrollbar-narrow relative flex flex-col overflow-y-scroll bg-gray-50 md:col-start-2 dark:bg-gray-950"
							id="page-scroll-wrapper">
        <Show when={!state.noHeader}>
          <Header logo={logo} />
        </Show>
							<AlertBox alerts={alerts} />
        <Show when={state.breadcrumbs.length}>
								<div class="max-w-main mx-auto w-full">
									<Breadcrumbs
										path={state.breadcrumbs}
										currentPath={location.pathname}
									/>
								</div>
        </Show>
							<main
          style={{'view-transition-name': state.wide ? undefined : 'main'}}
								classList={{
									'max-w-main': !state.wide,
									'p-3': !state.noHeader,
								}}
								class="@container/main z-0 col-start-2 mx-auto mb-8 w-full flex-1">
								<slot />
							</main>
							<div id="card-preview" />
							<Footer />
						</div>
					</div>
))
};
