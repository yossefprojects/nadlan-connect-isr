# NadlanConnect

A B2B2C Israeli real estate platform connecting buyers, agents, and developers. Features listings with price estimation, investment scoring, lead/messaging system, favorites, pro dashboard, and admin panel. Trilingual (FR/EN/HE) with RTL support scaffolded.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied to `/api`)
- `pnpm --filter @workspace/nadlan-connect run dev` — run the frontend (port 24705, proxied to `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + Radix UI + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Replit Auth (OpenID Connect / PKCE)
- Storage: Replit Object Storage (Uppy + presigned S3 URLs)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI 3.1 spec (source of truth for all API contracts)
- `lib/api-zod/src/generated/` — Zod schemas auto-generated from spec (do not edit)
- `lib/api-client-react/src/generated/` — React Query hooks auto-generated from spec (do not edit)
- `lib/db/src/schema/` — Drizzle DB schema (`auth.ts`, `listings.ts`, `leads.ts`)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/engine.ts` — price estimation + investment scoring engine
- `artifacts/nadlan-connect/src/pages/` — React page components
- `artifacts/nadlan-connect/src/components/` — Shared UI components

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed hooks + Zod schemas. Always update `openapi.yaml` first, then run codegen.
- **Inline engine**: Price estimation and investment score calculated server-side in `engine.ts`, attached to every listing on create/update.
- **Session auth**: Replit Auth uses a PostgreSQL sessions table (not JWT) with HttpOnly cookies.
- **Role system**: User roles (`buyer`, `agent`, `developer`, `admin`) stored in `users.role` column, set by user on first login via `/api/users/me/role`.
- **Zod in api-server**: Use `import { z } from "zod"` (not `zod/v4`) in the api-server because esbuild bundles it and the v4 sub-path isn't resolved correctly.

## Product

- **Public**: Browse/filter listings (city, type, price, surface), view listing detail with estimated price and investment score (0–100), sign in via Replit.
- **Buyer**: Save favorites, submit leads/contact agents, view messages.
- **Agent/Developer**: Pro dashboard — manage own listings (draft/publish), view incoming leads and messages, upload listing photos.
- **Admin**: Moderate all listings (approve/reject), view platform stats.

## Brand

- Navy `#1A3A5C`, Gold `#C9A84C`, Background `#F7F8FA`
- Fonts: DM Serif Display (headings), Plus Jakarta Sans (body)
- Trilingual shell: FR (default), EN, HE with RTL support planned

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **SelectItem values**: Radix UI `<SelectItem>` rejects `value=""`. Use a sentinel constant (e.g. `"__all__"`) for "all/any" options and convert back to `undefined` before passing to API hooks.
- **CSS import order**: `@import url(...)` for Google Fonts must come before all other `@import` statements in `index.css`.
- **`zod/v4` in api-server**: esbuild cannot resolve the `zod/v4` sub-path. Import `z` from `"zod"` directly in server code.
- **DB seed**: `owner_id` in listings has a FK to users. Always create the seed user first before seeding listings.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
