import { TRPCError, initTRPC } from '@trpc/server';
import type { Context } from './context';

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const adminProcedure = t.procedure.use(opts => {
	const { session } = opts.ctx;
	if (session?.type !== 'admin') {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	return opts.next({
		ctx: {
			session,
		},
	});
});

export const userProcedure = t.procedure.use(opts => {
	const { session } = opts.ctx;
	if (session?.type !== 'admin' && session?.type !== 'user') {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	return opts.next({
		ctx: {
			session,
		},
	});
});
