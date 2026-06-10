---
name: NadlanConnect demolition address confidentiality
description: Privacy rules for the Tama38/Pinui-Binui demolition module — exact address/coords must reach only the single chosen+validated promoter.
---

# Demolition address confidentiality

Exact address, lat/lng, and owner contact for a demolition listing are PRIVATE.
They are revealed ONLY to: the owner, an admin, or a promoter whose connection is
`validated`. Everyone else sees city + neighborhood + a fuzzed ~400 m approximate
circle (`approxLat`/`approxLng`, `APPROX_RADIUS_M`). Public list and anon detail
must always serialize with `reveal=false`.

## The one-validated-promoter invariant
There must be at most ONE `validated` connection per listing. The reveal check
grants exact data to *any* promoter with a validated connection, so allowing two
validations leaks the address to two promoters.

**Why:** the product rule is "address revealed to the chosen promoter only". The
DB unique key is `(listingId, promoterId)`, which does NOT prevent multiple
validated rows for one listing.

**How to apply:** admin validation (PATCH connection) must (1) refuse with 409 if
another `validated` connection already exists for that listing, and (2) on success
auto-reject all other still-`requested` connections for that listing. Re-rejecting
the current holder is required before a different promoter can be validated.

## Reveal/serialization rules
- `serializeListing(listing, offerCount, reveal, isOwner)` — nulls
  address/lat/lng/owner* unless `reveal`. `isOwner` is a separate boolean
  (viewer === ownerId), NOT derived from presence of contact fields, because a
  validated promoter also gets contact revealed — so owner-only UI (the "choose
  promoter" action) must gate on `isOwner`, not on `ownerEmail != null`.
- Geocoding is best-effort (Nominatim/OSM, no key); failures leave approx coords
  null and must never block listing creation. `fuzzCoords(lat,lng,listingId)` is
  deterministic (id-seeded) so the published approximate center is stable and
  can't be triangulated by re-querying. Exact coords are stored but only emitted
  when `reveal`.
- Commission is recorded only ("none"→"due" on validation); no online payment.
