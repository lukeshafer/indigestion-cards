import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@site/server/api';
import { resolveLocalPath } from '@site/constants';

export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: resolveLocalPath('/trpc'),
		}),
	],
});
