import { Router as SolidRouter, Route } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import HomePage from './HomePage';
import AllCardsPage from './AllCardsPage';
import Page from '@/components/Page';
import { ClientContext, type ClientContextProps } from '@/client/context';
import { onMount } from 'solid-js';

export const queryClient = new QueryClient();

export default function Router(props: { ssrUrl: string; ssrCtx: ClientContextProps }) {
	onMount(() => {
		const wrapper = document.querySelector('#app-router-wrapper');

		setInterval(
			() =>
				wrapper?.querySelectorAll('a').forEach(a => {
					const url = new URL(a.href);
					if (!url.pathname.startsWith('/new')) {
						url.pathname = '/new' + url.pathname;
						a.href = url.toString();
					}
				}),
			1000
		);
	});

	return (
		<div id="app-router-wrapper">
			<ClientContext.Provider value={props.ssrCtx}>
				<QueryClientProvider client={queryClient}>
					<SolidRouter url={isServer ? props.ssrUrl : ''} root={Page} base="/new">
						<Route path="/" component={HomePage} />
						<Route path="/card" component={AllCardsPage} />
						<Route path="/card/:designId" component={AllCardsPage} />
						<Route path="*404" component={() => <div>404</div>} />
					</SolidRouter>
				</QueryClientProvider>
			</ClientContext.Provider>
		</div>
	);
}
