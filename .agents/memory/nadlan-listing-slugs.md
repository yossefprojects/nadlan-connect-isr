---
name: NadlanConnect listing slug URLs
description: How professional/SEO listing URLs work — slug generation, resolution order, and back-compat.
---

Listing detail URLs are SEO slugs (`/listings/appartement-4-pieces-vue-mer-florentin-tel-aviv`) instead of numeric ids.

**Rules:**
- `listings.slug` is `NOT NULL UNIQUE`. Generated server-side from `slugify(title)`, with the city full name appended only if the title slug does not already contain it (avoids `...jerusalem-jerusalem`). Collisions get `-2`, `-3`, … via a pre-check helper.
- Slug is regenerated on update only when title or ville changes.
- `GET /listings/:listingId` resolves **slug first**, then falls back to a numeric id (legacy/bookmark back-compat). The OpenAPI param is `string`, so the generated `getListing` hook takes a string.
- Anything that needs the numeric listing id (favorites/leads/mandates mutations and comparisons) must read it from the loaded detail (`detail.listing.id`), NOT from the URL param (which is now a slug). Lead/Mandate API responses carry `listingSlug` so dashboard links stay clean.

**Why:** the user explicitly wanted clean, professional URLs across the whole site; slug-first + numeric fallback keeps new URLs canonical while never breaking old numeric links.

**How to apply:** when adding any new place that links to a listing, link with `listing.slug` (or `listingSlug ?? listingId`). When adding a listing field that feeds the slug, update `buildListingSlug` in `artifacts/api-server/src/lib/slug.ts`.
