---
name: Testing @react-pdf documents
description: How to unit-test @react-pdf/renderer document components (ReportDoc/ChatDoc) without rendering a real PDF.
---

# Testing @react-pdf document components

`react-test-renderer` does NOT work for @react-pdf/renderer under React 19 — its
primitives (`Document`/`Page`/`View`/`Text`) are plain **string** element types
(`"DOCUMENT"`, `"PAGE"`, `"VIEW"`, `"TEXT"`), and `TestRenderer.create(...).toJSON()`
returns `null` for them.

**Approach that works:** walk the React element tree manually. The document
components are pure and hook-free, so you can recursively invoke function
components (`type(props)`) and descend into string-typed hosts via
`props.children`, flattening into `{type, props, children}` nodes. Then extract
text and merge `style` (which may be an array, e.g. `[base, ltrIfNumeric(v)]`).

**Why:** lets a Node-env vitest test assert language-sensitive output (page
`direction` rtl/ltr, Hebrew `fontFamily` "Heebo" vs "Helvetica", FR `3 200 000`/
`8,5 %` vs EN/HE `3,200,000`/`8.5%`, `NIS` vs `₪`, and numeric runs forced LTR
inside RTL) without loading fonts or producing a binary PDF.

**How to apply:** export the doc components for tests; run with the artifact's
own vite-based `vitest.config.ts` so `.ttf` asset imports resolve. `.ttf` imports
are fine in Node — `Font.register` only stores the src string when no PDF is
rendered. Test command is wired at repo root (`pnpm run test` → `pnpm -r ... run test`)
and registered as the `test` validation.
