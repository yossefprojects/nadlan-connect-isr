/**
 * One-off migration — secure EXISTING demolition documents.
 *
 * Marks every already-uploaded demolition document as `private`, owned by its
 * listing's apporteur, so files uploaded before the ACL change stop being
 * readable by anyone who happens to hold the object URL. New documents are
 * already marked private at upload time (see routes/demolition.ts).
 *
 * Run on Replit (object storage is only reachable there), from the api-server
 * package:
 *
 *   pnpm tsx src/scripts/secure-demolition-docs.ts
 *
 * Idempotent: re-running simply re-sets the same ACL.
 */
import { db, demolitionDocumentsTable, demolitionListingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";

async function main(): Promise<void> {
  const svc = new ObjectStorageService();
  const docs = await db.select().from(demolitionDocumentsTable);
  let secured = 0;
  let failed = 0;

  for (const doc of docs) {
    const [listing] = await db
      .select({ ownerId: demolitionListingsTable.ownerId })
      .from(demolitionListingsTable)
      .where(eq(demolitionListingsTable.id, doc.listingId))
      .limit(1);

    if (!listing?.ownerId) {
      console.warn(`skip doc ${doc.id}: listing or owner not found`);
      failed++;
      continue;
    }

    try {
      await svc.trySetObjectEntityAclPolicy(doc.url, {
        owner: listing.ownerId,
        visibility: "private",
      });
      secured++;
    } catch (err) {
      console.error(`fail doc ${doc.id} (${doc.url}):`, err);
      failed++;
    }
  }

  console.log(`Done. secured=${secured} failed=${failed} total=${docs.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
