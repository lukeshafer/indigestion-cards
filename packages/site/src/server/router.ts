import { router, publicProcedure } from './trpc';

import { getSiteConfig } from '@lil-indigestion-cards/core/lib/site-config';

export const appRouter = router({
	siteConfig: publicProcedure.query(async () => getSiteConfig()),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
