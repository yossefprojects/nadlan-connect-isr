---
name: NadlanConnect listing detail photo source
description: Which field holds a listing's photos differs between the detail and list endpoints.
---

# Listing photos: unified on `galleryImageUrls`

Both the **list/summary** endpoint and the **detail** endpoint
(`GET /api/listings/:slug`) now populate `listing.galleryImageUrls` (ordered by
`position`). `galleryImageUrls` is **required** in the OpenAPI `Listing` schema,
so every listing-returning endpoint guarantees it (empty array when no photos).
Read `galleryImageUrls` everywhere for display — both `listing-card` and
`listing-detail` use it.

The detail response **also** still returns a richer `images` array
(`{id, listingId, url, position}`). That array is only for **photo management**
(reorder/delete need the image id) — used by `dashboard-listings-edit`. Do not
use `images` for plain display; use `galleryImageUrls`.

**Caveat:** the list endpoint caps `galleryImageUrls` at `GALLERY_LIMIT` (6) as a
summary; the detail endpoint returns all photos. Same field/shape, different cap.

**How to apply:** image `src` is `/api/storage<url>`. Seed demo photos with the
api-server `seed:images` script
(`pnpm --filter @workspace/api-server run seed:images`) — it's idempotent and
listings ship with no photos by default.

## Cover = position 0; reorder convention

The cover photo is **whichever image has the lowest `position`** (index 0 after
sorting). There is no separate "isCover" flag. To change the cover you reorder.

`PATCH /api/listings/:listingId/images/order` takes `{imageIds: number[]}` and
assigns `position = index`; **first id becomes the cover**. The handler is
owner/admin-guarded, ignores ids not on the listing, and appends any existing
images missing from the payload so a partial list never orphans photos.

**Why:** the cover drives the card and the SEO/social preview, so "set as cover"
in the Pro editor is just "move to front". The Pro photo editor
(`ListingPhotoGrid` component) reorders optimistically then persists; the
new-listing page reorders local `File`s and uploads them in order on create.
