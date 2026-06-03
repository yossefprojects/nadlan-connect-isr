---
name: NadlanConnect i18n (FR/EN/HE + RTL)
description: How trilingual translation and RTL work on the public site, and what must stay in sync.
---

# NadlanConnect i18n

FR/EN/HE is **functional** on public surfaces AND the Pro dashboards (agent/developer) + admin panel (no longer just scaffolded). Pattern:

- A flat-namespaced dictionary in `src/lib/i18n.ts` holds three blocks (FR/EN/HE). Keys are dotted strings like `detail.*`, `listings.*`, `card.*`. `translate(lang, key)` looks up the block.
- `LanguageProvider` exposes `t()/language/dir/setLanguage`, persists choice to `localStorage["nadlan-lang"]`, and sets `document.documentElement.dir` + `lang` in an effect. Default language is **fr**.
- RTL: relies on `dir="rtl"` on `<html>` + Tailwind v4's built-in `rtl:` variant. Logical flips for absolutely-positioned elements need explicit `rtl:` classes (e.g. a `left-3` badge needs `rtl:left-auto rtl:right-3`); flexbox/text-align mirror automatically from `dir`.

**Rules to keep it working:**
- Every new public-facing string must use `t()` and have a key in **all three** blocks. Shared components (e.g. `listing-card.tsx`) are easy to forget — they render on multiple public pages, so French leaks there are very visible in EN/HE.
- Proper nouns stay untranslated by design: city labels (VILLE_LABELS / CITY_LABELS) and listing data (title/quartier).
- AI property-analysis (`/outils/analyse-ia`): the chosen language is part of the contract — OpenAPI `language` enum (fr|en|he) → frontend sends it in the analyze payload → server `buildSystemPrompt(language)` tells Claude which language to answer in. Keep these three in lockstep.

**Verifying HE/RTL without clicking:** the screenshot tool can't operate the dropdown. Temporarily flip the `getInitialLanguage()` fallback from `"fr"` to `"he"`, restart the web workflow, screenshot, then revert. Don't leave the default as he.
