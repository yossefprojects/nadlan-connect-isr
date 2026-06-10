---
name: NadlanConnect build gotchas
description: Sharp edges discovered while building the NadlanConnect platform — esbuild, Radix UI, CSS, and DB seeding quirks.
---

## `zod/v4` sub-path in api-server esbuild bundle
**Rule:** Use `import { z } from "zod"` in `artifacts/api-server/src/`, never `"zod/v4"`.
**Why:** esbuild cannot resolve the `zod/v4` sub-path export even when zod is installed. The v4 compat layer is a package.json `exports` field entry that esbuild doesn't follow in this setup.
**How to apply:** Any new server-side file needing Zod should import from `"zod"`. Also ensure `zod` is in `dependencies` (not just devDependencies) of `artifacts/api-server/package.json`.

## Radix UI `<SelectItem value="">` crash
**Rule:** Never pass `value=""` to Radix `<SelectItem>`. Use a sentinel constant (e.g. `"__all__"`) for "show all" options and convert to `undefined` before passing to API hooks.
**Why:** Radix Select uses empty string to clear the selection and show the placeholder. Passing it as an item value causes a runtime throw.
**How to apply:** Define `const ALL = "__all__"` at the top of any file using filtered Select dropdowns.

## CSS `@import` order in Tailwind v4 / PostCSS
**Rule:** In `index.css`, `@import url(...)` for external fonts must be the very first line, before `@import "tailwindcss"` and `@import "tw-animate-css"`.
**Why:** PostCSS requires all `@import` statements to precede other rules. tw-animate-css inlines CSS that ends up before the Google Fonts import, triggering a PostCSS error.
**How to apply:** When adding font imports or any `@import url(...)`, place them at the top of `index.css` before all other imports.

## Orval `type: integer` does not generate `.int()` zod validation
**Rule:** OpenAPI `type: integer` fields generate `zod.number()` (no `.int()`), so decimal input passes validation and only fails at the INTEGER DB column → HTTP 500, not 400.
**Why:** This Orval zod codegen behavior is project-wide (e.g. `units`, `buildYear`, demolition offer `floors`/`parkingPerUnit`). Out-of-contract decimals reach the DB and throw.
**How to apply:** Enforce integers at the UI (`step="1"` on number inputs) as the practical backstop. Don't add `.int()` to only some fields — it's inconsistent with the rest of the codebase. Accept that direct-API decimal posts 500 (systemic, pre-existing).

## DB seeding with FK constraints
**Rule:** When seeding `listings`, always insert the seed user into `users` first. The `owner_id` column has a FK to `users.id`.
**Why:** PostgreSQL enforces FK constraints even during seeding — inserting a listing with a non-existent `owner_id` throws an FK violation.
**How to apply:** Seed scripts should always create the owner user (with `ON CONFLICT DO NOTHING`) before inserting their listings.
