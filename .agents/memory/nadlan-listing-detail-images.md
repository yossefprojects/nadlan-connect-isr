---
name: NadlanConnect listing detail photo source
description: Which field holds a listing's photos differs between the detail and list endpoints.
---

# Listing photos: detail vs list endpoint

The listing **detail** endpoint (`GET /api/listings/:slug`) returns photos in a
separate `images` array (`{id, listingId, url, position}`) and leaves
`listing.galleryImageUrls` **empty**. The **list/summary** endpoint (used by the
grid cards) populates `listing.galleryImageUrls` instead.

**Why this matters:** reading `galleryImageUrls` on a detail response silently
yields no photos (the gallery falls back to a single cover image and hides its
controls). The detail gallery must build its image list from `detail.images`
(sort by `position`, map to `url`), then fall back to `galleryImageUrls` then
`coverImageUrl`.

**How to apply:** on the detail page use `detail.images`; image `src` is
`/api/storage<url>`. Seed demo photos with the api-server `seed:images` script
(`pnpm --filter @workspace/api-server run seed:images`) — it's idempotent and
listings ship with no photos by default. A future task may unify these two
endpoints onto one field.

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
