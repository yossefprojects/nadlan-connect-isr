---
name: Vitest transform-heavy import inside beforeAll
description: Why a dynamic import of a route/module inside a vitest beforeAll flakily times out, and the fix.
---

# Transform-heavy dynamic import must not live inside a timed vitest hook

If a vitest test does `const x = (await import("./big-module.js")).default;`
inside `beforeAll`, the module's (slow) esbuild/vite transform runs *inside* the
hook and races the hook timeout (default 10s). Under machine load — e.g. right
after many task merges restart every workflow — that transform can exceed even a
30s hook timeout and the whole suite is reported as skipped/failed
("Hook timed out in Nms" at the `beforeAll` line).

**Fix:** move the import to **top-level `await`** (module/collection phase),
which has no hook timeout, and keep only the cheap app/server setup inside
`beforeAll`. `vi.mock(...)` is hoisted above top-level code, so mocks are still
in place when the top-level import runs.

**Why:** the import cost is transform time, not the hook's own work; collection
phase is the right place to pay it.

**How to apply:** any api-server route test that imports the route under test
and mounts it on an express app. Also guard `afterAll` with `if (server)` so a
failed setup doesn't throw `Cannot read properties of undefined (reading
'close')` and mask the real error.

Related: the project's post-merge script (`scripts/post-merge.sh`,
`pnpm install` + db push) can take ~30s under merge-cascade load; its
`[postMerge] timeoutMs` in `.replit` must stay generous (set to 180000 via
`setPostMergeConfig`, NOT by editing `.replit` directly — direct edits are
blocked).
