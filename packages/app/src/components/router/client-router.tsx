import { onMount, lazy } from 'solid-js';
import { Router as SolidRouter, Route } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import AllCardsPage from './AllCardsPage';
import Page from '@/components/Page';
import { ClientContext, type ClientContextProps } from '@/client/context';
import DesignPage from './DesignPage';
import HomePage from './HomePage';
import { fetchAllDesigns, fetchDesign, fetchRarityRanking, fetchSiteConfig } from '@/client/data';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

// TODO: re-add query client and provider!!!
const queryClient = new QueryClient();

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
						<Route
							path="/"
							component={HomePage}
						/>
						{
							//<Route
							//path="/card"
							//component={AllCardsPage}
							//load={() => {
							//void fetchAllDesigns(queryClient).data;
							//}}
							///>
							//<Route
							//path="/card/:designId"
							//component={DesignPage}
							//load={({ params }) => {
							//void fetchDesign(params.designId, queryClient).data;
							//void fetchRarityRanking(queryClient).data;
							//}}
							///>
						}
						<Route path="*404" component={() => <div>404</div>} />
					</SolidRouter>
				</QueryClientProvider>
			</ClientContext.Provider>
		</div>
	);
}
