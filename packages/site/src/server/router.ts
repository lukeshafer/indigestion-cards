import { router, publicProcedure } from './trpc';
import { z } from 'astro/zod'

export const appRouter = router({
  userList: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      // Retrieve users from a datasource, this is an imaginary database
      const users = [input, 'user 1', 'user 2']
      return users;
    }),
  userCreate: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      console.log({ input })
    })
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
