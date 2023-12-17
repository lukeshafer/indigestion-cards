import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../functions/src/trpc';
export type { RouterInput, RouterOutput }from '../../../functions/src/trpc';

const apiURL = import.meta.env.VITE_API_URL ?? "";

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [httpBatchLink({ url: `${apiURL}/trpc` })],
});
