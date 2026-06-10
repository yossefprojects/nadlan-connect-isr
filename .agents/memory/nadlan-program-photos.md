---
name: NadlanConnect programme photos
description: How new-development programme images are stored/served (differs from listings).
---

Programme (new-development) photos do NOT use `listing_images` and are NOT served
via `/api/storage`. They live in the unified `documents` table
(`category = "photo"`, `visibility = "public"`, `programId` set) and are served
via `/api/documents/:id/download`.

- Programme cover = first photo document (`coverForProgram` in
  `routes/programs.ts`) → exposed as `coverImageUrl`.
- Programme detail (`GET /programs/:id`) returns `documents[]`; the page filters
  `category === "photo"` for the visual gallery, and `DocumentManager` lists all
  docs as downloadable rows.

**Why:** listings and programmes use two different media systems. A task asking to
"serve programme photos via /api/storage like listings" is based on a wrong
assumption — programmes already have their own (documents) path; reuse it instead
of bolting on a second mechanism.

**How to apply:** to seed/show programme images, insert `documents` rows (photo,
public) via object storage upload, mirroring `scripts/seed-program-images.ts`
(which also creates a few demo programmes when the DB has none).
