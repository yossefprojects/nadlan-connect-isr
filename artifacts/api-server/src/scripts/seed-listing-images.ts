/**
 * Seed sample photos for demo listings so the multi-photo gallery is visible
 * out of the box.
 *
 * Images are uploaded through the SAME flow real uploads use: a presigned PUT to
 * the private object dir, then the normalized `/objects/...` path is stored in
 * `listing_images`. They are then served via the existing `/api/storage` route.
 *
 * Idempotent: listings that already have at least one image are skipped, so the
 * script is safe to re-run.
 */
import path from "node:path";
import { readFile } from "node:fs/promises";
import { db, listingsTable, listingImagesTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";

// Pool of sample real-estate photos bundled with the api-server package.
// Order is "hero-first" so position 0 reads as a sensible cover.
const IMAGE_POOL = [
  "exterior_1.png",
  "kitchen_1.png",
  "dining_1.png",
  "balcony_1.png",
  "bathroom_1.png",
] as const;

const PHOTOS_PER_LISTING = 4;
const SEED_ASSETS_DIR = path.resolve(process.cwd(), "seed-assets");

async function uploadImage(
  svc: ObjectStorageService,
  bytes: Buffer
): Promise<string> {
  const uploadURL = await svc.getObjectEntityUploadURL();
  const res = await fetch(uploadURL, {
    method: "PUT",
    body: bytes,
    headers: { "Content-Type": "image/png" },
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  }
  // Normalizes the googleapis URL to a stored "/objects/<id>" path.
  return svc.normalizeObjectEntityPath(uploadURL);
}

async function main(): Promise<void> {
  const svc = new ObjectStorageService();

  const listings = await db
    .select({ id: listingsTable.id, title: listingsTable.title })
    .from(listingsTable)
    .orderBy(listingsTable.id);

  if (listings.length === 0) {
    console.log("No listings found. Nothing to seed.");
    return;
  }

  // Skip listings that already have images so re-runs don't duplicate.
  const existing = await db
    .select({ listingId: listingImagesTable.listingId })
    .from(listingImagesTable)
    .where(
      inArray(
        listingImagesTable.listingId,
        listings.map((l) => l.id)
      )
    );
  const alreadyHasImages = new Set(existing.map((e) => e.listingId));
  const todo = listings.filter((l) => !alreadyHasImages.has(l.id));

  if (todo.length === 0) {
    console.log(
      `All ${listings.length} listing(s) already have images. Nothing to do.`
    );
    return;
  }

  console.log(
    `Uploading ${IMAGE_POOL.length} sample photo(s) to object storage...`
  );
  // Upload each distinct sample photo once, then reuse the stored paths across
  // listings (rotated per listing so covers differ).
  const uploadedPaths: string[] = [];
  for (const file of IMAGE_POOL) {
    const bytes = await readFile(path.join(SEED_ASSETS_DIR, file));
    const objectPath = await uploadImage(svc, bytes);
    uploadedPaths.push(objectPath);
    console.log(`  ${file} -> ${objectPath}`);
  }

  let totalImages = 0;
  for (let i = 0; i < todo.length; i++) {
    const listing = todo[i];
    // Rotate the pool by listing index so cover photos vary between listings.
    const rows = Array.from({ length: PHOTOS_PER_LISTING }, (_, pos) => {
      const idx = (i + pos) % uploadedPaths.length;
      return {
        listingId: listing.id,
        url: uploadedPaths[idx],
        position: pos,
      };
    });
    await db.insert(listingImagesTable).values(rows);
    totalImages += rows.length;
    console.log(
      `Seeded ${rows.length} photo(s) for listing #${listing.id} "${listing.title}"`
    );
  }

  console.log(
    `Done. Seeded ${totalImages} image row(s) across ${todo.length} listing(s).`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
