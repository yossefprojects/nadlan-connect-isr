---
name: NadlanConnect global header layout (MarketBar + Navbar)
description: Why the navbar's position strategy is conditional on the home route, and the regression to avoid.
---

# Global header positioning is route-conditional

`AppLayout` renders `MarketBar` + `Navbar` together inside ONE wrapper whose
position is chosen by route: `fixed` on home (`location === "/"`), `sticky` on
every other page.

**Why:** The home hero is a full-bleed `h-[100svh]` cinematic section and the navbar
must float **transparently over** it — that requires the header to be out of normal
flow (`fixed`). But making the navbar `fixed` *globally* is a trap: on every
non-home page it then overlays the top of the page content (and the MarketBar),
hiding the page heading behind it. Conversely a globally `sticky`/in-flow navbar
breaks home, because a transparent bar then sits on the light page background
(`#F8F7F4`) with white text → invisible.

**How to apply:** Keep the conditional wrapper. The `Navbar` component itself must
stay position-neutral (`w-full`, no `fixed`/`top-0` of its own) so the wrapper owns
positioning. Its scroll-to-glass effect is driven by `window.scrollY` + an internal
`isHome` check, independent of the wrapper. If you add another full-bleed landing
page, extend the `isHome` condition rather than reverting the navbar to `fixed`.
