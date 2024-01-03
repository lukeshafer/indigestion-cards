import { Router as SolidRouter, Route } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import Home from './Home';
import type { Session } from '@lil-indigestion-cards/core/types';
import { createContext, useContext } from 'solid-js';

type ClientContextProps = {
	session: Session | null;
	disableAnimations: boolean;
}

export const queryClient = new QueryClient();
const ClientContext = createContext<ClientContextProps | null>(null);
export const useClientContext = () => useContext(ClientContext);

export default function Router(props: { ssrUrl: string; ssrCtx: ClientContextProps }) {
	return (
		<ClientContext.Provider value={props.ssrCtx}>
			<QueryClientProvider client={queryClient}>
				<SolidRouter url={isServer ? props.ssrUrl : ''} base="/new">
					<Route path="/" component={Home} />
				</SolidRouter>
			</QueryClientProvider>
		</ClientContext.Provider>
	);
}
