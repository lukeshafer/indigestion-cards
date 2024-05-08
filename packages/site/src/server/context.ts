import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { APIContext } from 'astro';

export function createAstroContext(ctx: APIContext) {
	return function createContext(opts: FetchCreateContextFnOptions) {
		const session = ctx.locals.session;

		return { ...opts, session };
	};
}

export type TRPCContext = Awaited<ReturnType<ReturnType<typeof createAstroContext>>>;
