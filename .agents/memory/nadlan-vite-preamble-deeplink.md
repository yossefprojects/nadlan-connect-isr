---
name: NadlanConnect dev-only blank on hard-loaded deep links
description: Why screenshots/Playwright of /listings/:slug render blank in dev, and how to verify pages that aren't the home route.
---

# Dev-only blank page on hard-loaded deep URLs

In the nadlan-connect Vite dev server, directly hard-loading a deep SPA route
(e.g. `/listings`, `/listings/:slug`) renders a completely blank page
(`document.body.innerText` empty). The uncaught error is
`@vitejs/plugin-react can't detect preamble` thrown from the first React module
in that route's import graph. The home route `/` hard-loads fine.

**Why:** the React Fast-Refresh preamble is only reliably injected for the root
HTML load; hard-loading a deep URL serves HTML without the preamble flag, so the
first transformed module throws. It is **dev-only** — production builds have no
Fast-Refresh preamble, so this does not affect the published app.

**How to apply:**
- The `screenshot` tool and Playwright `runTest` both *hard-load* the URL you
  give them, so they hit this blank on any non-root route. A blank screenshot of
  a deep route is NOT proof the page/feature is broken.
- To verify a non-home page, navigate **client-side**: load `/` first, then
  click in-app links (wouter) to reach the target route. No full reload = no
  blank.
- Don't waste time "fixing" a deep-route blank as if it were your feature's bug;
  confirm via client-side navigation first.
