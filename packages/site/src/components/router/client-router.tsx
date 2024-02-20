import { Router as SolidRouter, Route } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import Page from '@/components/Page';
import { ClientContext, type ClientContextProps } from '@/client/context';
import HomePage from './HomePage';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

const queryClient = new QueryClient();

export default function Router(props: { ssrUrl: string; ssrCtx: ClientContextProps; ssrData: any }) {
	return (
		<div>
			<ClientContext.Provider value={props.ssrCtx}>
				<QueryClientProvider client={queryClient}>
					<SolidRouter url={isServer ? props.ssrUrl : ''} root={Page}>
						<Route
							path="/"
              load={() => props.ssrData}
							component={HomePage}
						/>
						<Route path="*404" component={() => <div>404</div>} />
					</SolidRouter>
				</QueryClientProvider>
			</ClientContext.Provider>
		</div>
	);
}
