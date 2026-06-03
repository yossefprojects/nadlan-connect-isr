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
- Auth: Email + password (bcrypt via `bcryptjs`), PostgreSQL-backed session cookies (HttpOnly)
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
- `artifacts/api-server/src/routes/anthropic.ts` — AI property-analysis route (Anthropic Claude)
- `lib/integrations-anthropic-ai/` — Replit-managed Anthropic client (billed to credits, no user key)
- `artifacts/nadlan-connect/src/pages/analyse-ia.tsx` — "Dashboard Investisseur" AI analysis page (`/outils/analyse-ia`)
- `artifacts/nadlan-connect/src/pages/` — React page components
- `artifacts/nadlan-connect/src/components/` — Shared UI components

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed hooks + Zod schemas. Always update `openapi.yaml` first, then run codegen.
- **Inline engine**: Price estimation and investment score calculated server-side in `engine.ts`, attached to every listing on create/update.
- **Email/password auth**: `POST /api/auth/register` (buyer), `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/user`. Passwords bcrypt-hashed in `users.passwordHash`. Pro onboarding (`/api/profiles/agence|promoteur`) also creates a login-capable `users` row. Sessions stored in a PostgreSQL sessions table (not JWT) with HttpOnly cookies.
- **Role system**: User roles (`buyer`, `agent`, `developer`, `admin`) stored in `users.role`. Buyers self-select via `/api/users/me/role` (which **cannot** assign `admin`); pros get their role at registration. Admin is bootstrapped manually (register, then `UPDATE users SET role='admin'`).
- **Admin authorization**: every `/admin/*` route and the admin user-management routes (`GET /users`, `PATCH /users/:userId`) are guarded by the `requireAdmin` middleware — `req.isAuthenticated()` alone is never sufficient.
- **Post-login redirect** (client): developer→`/dashboard/promoteur`, agent→`/dashboard/agence`, admin→`/dashboard/admin`, buyer→`/`.
- **Slug URLs**: Listings use a stored, unique SEO `slug` (generated from title + city). `GET /listings/:listingId` resolves slug-first, then falls back to a numeric id for legacy links. Link to listings via `slug`; read the numeric id from the loaded detail for mutations.
- **Zod in api-server**: Use `import { z } from "zod"` (not `zod/v4`) in the api-server because esbuild bundles it and the v4 sub-path isn't resolved correctly.

## Product

- **Public**: Browse/filter listings (city, type, price, surface), view listing detail with estimated price and investment score (0–100), sign in with email + password.
- **Buyer**: Save favorites, submit leads/contact agents, view messages.
- **Agent/Developer**: Pro dashboard — manage own listings (draft/publish), view incoming leads and messages, upload listing photos.
- **Admin**: Moderate all listings (approve/reject), view platform stats.
- **AI analysis** (`/outils/analyse-ia`, public): Paste a listing → Claude returns a structured investment analysis (features incl. Mamad/elevator, anomalies, market price/m², rental yield, renovation budget, urban potential TAMA38/Pinoui Binoui, score + recommendation). Public LLM endpoint is protected by a contract input cap (maxLength) + in-memory rate limit; the integration client is imported lazily so missing env fails only this route.

## Brand

- Navy `#0F2235` (darkest), Blue `#1A3A5C`, Gold `#C9A84C`, Background `#F8F7F4` (matches sister site simzip)
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
