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

## Glyph / number-formatting gotcha (built-in Helvetica = WinAnsi only)

The built-in `Helvetica` can only render WinAnsi glyphs. Two silent corruptions to guard against:

- **`Intl.NumberFormat('fr-FR')` thousands separator is U+202F** (narrow no-break space), which has no WinAnsi glyph → renders as **`/`** (e.g. `26 000 000` becomes `26/000/000`). Fix: group digits with a **plain ASCII space** yourself (`n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")`), don't rely on Intl.
- **`₪` (U+20AA) has no WinAnsi glyph** → renders as **`ª`**. Use the literal text **`NIS`** instead (Helvetica can't do Hebrew/shekel).
- Any **LLM- or user-supplied free text** can contain `₪`, `≈`, en/em dashes, smart quotes, and narrow/thin spaces. Run it through a `sanitize()` that maps these to ASCII (`₪→NIS`, `≈→~`, `−–—→-`, smart quotes→`'`/`"`, exotic spaces→` `) before putting it in a `<Text>`.

**Why:** these failures are invisible in code review and only show up in the rendered PDF; they were a real user-reported bug. The `×` (U+00D7), `·` (U+00B7), `²` (U+00B2), `—` em dash, and accented Latin are all in WinAnsi and render fine — only the above need handling.

## Localizing the report (FR/EN/HE) + Hebrew font + RTL

The report's static chrome is translated by passing the active `language` (not a precomputed `locale`) into the doc builders; they call `translate(language, key)` over a `report.*` key namespace in `i18n.ts`. AI-generated content is already localized via the analysis contract — leave it untouched.

- **Helvetica and DM Serif Display have NO Hebrew glyphs.** For `he`, register a **static** Hebrew TTF and use it for everything; for `fr`/`en` keep Helvetica/DM Serif. We bundled **Heebo Regular + Bold** (verified full Latin+Hebrew+digit coverage via fonttools). The Google variable Heebo and the Hebrew-only subset both failed — variable fonts don't parse, and subsets dropped Latin digits.
- Make styles a **`makeStyles(fonts, rtl)` factory**, not a static `StyleSheet`. Switch `fontFamily` by language and flip *physical* props for RTL: page `direction: "rtl"`, and the side of margins/padding/borders (section-number badge, bullet/anomaly accent border). Label/value flex rows reverse naturally under `direction: rtl`.
- **Verify headlessly before shipping fonts:** `node` + `renderToBuffer` with `Font.register({src: "src/assets/fonts/X.ttf"})` and a Hebrew+RTL test page; a valid `%PDF-` buffer confirms the font parses (catches the variable-font rejection that otherwise only throws at `toBlob()` in the browser).
- Number/currency formatting is per-reader via a `makeFmt(lang)` factory whose outputs are destructured inside the doc builders (shadowing module-level helpers). FR = ASCII-space thousands + decimal comma + "8,5 %" + `NIS`; EN/HE = comma thousands + decimal point + "8.5%"; HE currency = ₪ (verified Heebo has U+20AA via fontkit `hasGlyphForCodePoint`), FR/EN keep `NIS` (Helvetica has no ₪). Keep FR thousands as ASCII space — never Intl fr-FR (U+202F → "/"). `sanitizeText(txt, keepShekel)` preserves ₪ only on the Hebrew path; `keepShekel = lang === "he"` is threaded through `parseMarkdown`/`stripInline` for the chat export too.
