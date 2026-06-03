---
name: NadlanConnect ↔ simzip shared visual family
description: NadlanConnect and israel-simzip.replit.app must stay a cohesive visual family; shared design tokens.
---

NadlanConnect (`nadlan-connect.replit.app`) and the sister simulator site (`israel-simzip.replit.app`) are intentionally kept as one visual family so users moving between them recognize the same ecosystem.

**Shared tokens (use these hex values directly, the codebase mixes them with the HSL theme vars):**
- Navy (footer/hero darkest): `#0F2235`
- Blue (header/navbar): `#1A3A5C`
- Gold (CTA, accents, active nav): `#C9A84C`
- Page background: `#F8F7F4` (warm white — NOT cream `#F0EBE1`)
- Card border: `#E5E7EB` at 0.5px, radius 10px, shadow `0 1px 4px rgba(0,0,0,0.06)`, hover gold border + `0 4px 16px rgba(26,58,92,0.12)`
- Market bar background: `#0A1628`
- Score badge thresholds: `>=70` green `#0F6E56`/`#EAF3DE`, `>=45` orange `#BA7517`/`#FAEEDA`, else red `#993C1D`/`#FCEBEB`
- Fonts: DM Serif Display (headings, weight 400) + Plus Jakarta Sans (body) — loaded via `index.html` link only (not also `index.css` @import, to avoid duplicate requests)
- Hero pattern: navy gradient `linear-gradient(160deg,#0F2235,#1A3A5C 60%,#0F2235)` + faint white skyline SVG (opacity 0.12), eyebrow badge, serif title with gold accent span, pill CTAs.

**Why:** the user explicitly wants both sites to look like one product. Any future visual change to one side should be mirrored or kept compatible with the other.

**How to apply:** when restyling NadlanConnect, prefer these tokens; for low-contrast small text on dark sections bump muted grays (e.g. `#9CABBF`/`#8995A5`) instead of the spec's `#6B7280`/`#4B5563` to keep WCAG AA.
