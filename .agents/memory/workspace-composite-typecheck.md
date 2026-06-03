---
name: Workspace composite tsconfig gotcha
description: Why one lib's tsconfig can make the whole monorepo typecheck fail with TS6306 and hide real errors.
---

# Composite tsconfig aborts the whole typecheck

`pnpm run typecheck` runs `tsc --build` over the composite libs first. If a `lib/*` package's `tsconfig.json` is missing the composite-package fields (`composite: true`, `declarationMap: true`, `emitDeclarationOnly: true`), `tsc --build` fails that lib with **TS6306** ("Referenced project ... must have setting 'composite': true") and **aborts before the leaf artifacts are ever checked**.

**Why this bites:** the error looks like a config problem, but its real damage is that it *masks* genuine type errors in the artifacts (favorites, query keys, mutation arg shapes, etc.) that only surface once the composite build passes. A red typecheck at HEAD may be hiding several unrelated latent bugs.

**How to apply:** when adding/auditing a `lib/*` package, ensure its tsconfig has the three composite fields and it's listed in the root `tsconfig.json` `references`. If `pnpm run typecheck` reports TS6306, fix that first, then re-run — expect previously-hidden errors to appear.
