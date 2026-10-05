// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import aws from "astro-sst";
import solid from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  prefetch: {
    prefetchAll: true,
  },
  output: "server",
  adapter: aws(),
  integrations: [tailwind(), solid()],
  vite: {
    ssr: {
      external: ["electrodb"],
      noExternal: ["@formkit/auto-animate"],
    },
    optimizeDeps: {
      exclude: ["sst"],
    },
  },
  redirects: {
    "/admin/open-packs": "/open-packs",
    "/card": "/cards",
    "/card/[designId]": "/cards/[designId]",
    "/card/[...instanceSlug]": "/cards/[...instanceSlug]",
    "/user": "/users",
    "/user/[username]": "/users/[username]",
    "/user/[...userInstanceSlug]": "/users/[...userInstanceSlug]",
  },
});
