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
