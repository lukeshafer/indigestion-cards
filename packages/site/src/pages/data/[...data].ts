import { data } from "@/lib/routes.config";
import type { APIRoute } from "astro";

export const GET = ( async (ctx) => {
  const path = ctx.url.pathname.split('/');
  const type = path[2];

  if (!(type in data)) {
    return new Response(null, { status: 404 });
  }

  const loader = data[type as keyof typeof data];
  return loader.GET(ctx);
} ) satisfies APIRoute;
