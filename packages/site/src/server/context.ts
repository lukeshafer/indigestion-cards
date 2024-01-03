import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { APIContext } from 'astro';

export function createAstroContext(ctx: APIContext) {
	return function createContext(opts: FetchCreateContextFnOptions) {
		return {
			...opts,
			session: ctx.locals.session,
		};
	};
}

type CreateContext = Awaited<ReturnType<typeof createAstroContext>>;
export type Context = Awaited<ReturnType<CreateContext>>;
