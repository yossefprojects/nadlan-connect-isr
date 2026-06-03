---
name: Branded PDF export in the Vite frontend
description: How client-side PDF reports are generated in NadlanConnect and the font/import gotchas.
---

# Branded PDF export (@react-pdf/renderer)

NadlanConnect generates downloadable branded PDFs **client-side** with `@react-pdf/renderer` (e.g. the AI analysis report). Key decisions and constraints:

- **Lazy-import the PDF module** from the click handler (`await import("@/lib/report-pdf")`). @react-pdf is heavy; this keeps it out of the initial bundle and Vite code-splits it.
- **Fonts must be TTF/OTF, not WOFF/WOFF2.** @react-pdf cannot parse woff. Bundle a static `.ttf` in `src/assets/fonts/` and `Font.register({ family, src: ttfUrl })` where `ttfUrl` is the Vite asset import (`import url from "../assets/fonts/X.ttf"`). `vite/client` already types `*.ttf`, so no extra d.ts needed.
  - **Avoid variable fonts** (e.g. Plus Jakarta Sans in google/fonts is variable) — @react-pdf chokes on them. Use a static instance, or fall back to the built-in `Helvetica`/`Helvetica-Bold` for body text (no registration needed). We register **DM Serif Display** (static, brand serif) for headings/score and use Helvetica for body.
- **Per-page footer + page numbers:** wrap the footer `View` with `fixed`, and use `<Text render={({pageNumber, totalPages}) => ...} />`.
- **Dotted leader rows** (label …… value): a flex row with a `flexGrow:1` View whose `borderBottomStyle: "dotted"` draws the leader.
- **Download:** `pdf(<Doc/>).toBlob()` → object URL → anchor click. Defer `URL.revokeObjectURL` (`setTimeout … 10s`) so it doesn't race the download start in some browsers.

**Why:** the first instinct (fontsource woff, or the variable Plus Jakarta TTF) silently fails to render or throws at `toBlob()`. Bundled static TTF + Helvetica fallback is the reliable path.
