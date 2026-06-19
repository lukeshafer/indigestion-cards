# Repo Context

## Package manager: pnpm
- All scripts in root `package.json` use `pnpm --filter <workspace>` for workspaces
- pnpm workspace config in `pnpm-workspace.yaml`

## Workspaces (packages/*)
- `admin` — Astro-based admin dashboard (SolidJS components)
- `site` — Astro-based public-facing site (SolidJS components)
- `core` — Shared lib, types, db schemas, auth
- `functions` — SST Lambda functions (some still active)

## Key scripts (root package.json)
| Command | What it does |
|---|---|
| `pnpm check` | Runs typecheck across all workspaces in parallel |
| `pnpm admin:check` | Typecheck admin package: `astro check && tsc --noEmit` |
| `pnpm site:check` | Typecheck site package: `astro check && tsc --noEmit` |
| `pnpm functions:check` | Typecheck Lambda functions: `tsc --noEmit` |
| `pnpm core:check` | Typecheck core lib: `tsc --noEmit` |
| `pnpm root:check` | Typecheck root: `tsc --noEmit` |
| `pnpm admin:dev` | Run admin dev server |
| `pnpm site:dev` | Run site dev server |
| `pnpm dev` | `sst dev` (full SST dev mode) |
| `pnpm build` | `sst build` |
| `pnpm deploy` | `sst deploy` |
| `pnpm remove` | `sst remove` |

## Infrastructure (infra/)
- SST v4 (IaC) — defines DynamoDB tables, S3 buckets, API Gateway, Lambda functions, auth, event bus, WebSocket API, CDN
- Config files: `infra/api.ts`, `infra/site.ts`, `infra/admin-site.ts`, `infra/database.ts`, etc.
- `sst.config.ts` — root SST config, imports infra modules

## Admin API routing
- Astro API routes in `packages/admin/src/pages/api/admin/*.ts`
- Each file exports named HTTP method handlers (GET, POST, PATCH, DELETE)
- The middleware (`middleware.ts`) handles auth via sequence: `auth -> transformMethod -> logMiddleware`
  - `auth` — verifies JWT cookies, checks admin session, sets `ctx.locals.session`
  - `transformMethod` — converts `?formmethod=PATCH` search params into actual request method
- Non-GET/POST methods are sent by the client as POST with `?formmethod=<method>`

Client API paths defined as proxies in `packages/admin/src/constants.ts`:
```ts
export const API = new Proxy(api_paths, {
  get: (target, prop) => '/api/admin' + target[prop],
});
```

## Path aliases (admin tsconfig)
- `@admin/*` -> `./src/*`
- `@core/lib/*` -> `../core/src/lib/*`
- `@core/types` -> `../core/src/types`
- `@core/constants` -> `../core/src/constants`
- `@core/db` -> `../core/src/db`

## Framework notes
- **UI**: SolidJS with Astro Islands (`.tsx` files, `client:load` directives)
- **Styling**: Tailwind CSS
- **Database**: DynamoDB via `@core/lib/*` functions (ElectroDB/entity-based)
- **Auth**: Custom JWT-based auth using `@core/lib/auth` (oslo/arctic-style pattern)
- **Deployment**: SST v4 to AWS (us-east-2)
- **Legacy**: `sstv2` package available for backward compat with old Lambda patterns
