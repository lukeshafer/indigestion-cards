import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@site/server/router';
export type { UserCardsInput } from '@site/server/router';
import { resolveLocalPath } from '@site/constants';

export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: resolveLocalPath('/trpc'),
		}),
	],
});
