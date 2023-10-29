import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../functions/src/trpc';
//import superjson from 'superjson';

const apiURL = import.meta.env.SSR
	? await import('sst/node/api').then((m) => m.Api.trpcApi.url)
	: String(localStorage.TRPC_URL);

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [httpBatchLink({ url: `${apiURL}/trpc` })],
	//transformer: superjson
});
