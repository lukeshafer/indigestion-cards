import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { APIRoute } from "astro";
import { createAstroContext } from "@site/server/context";
import { appRouter } from "@site/server/router";

export const ALL: APIRoute = (ctx) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: ctx.request,
    router: appRouter,
    createContext: createAstroContext(ctx),
  })
}
