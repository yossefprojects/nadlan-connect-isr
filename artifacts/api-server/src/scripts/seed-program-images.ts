/**
 * Seed sample photos for demo new-development programmes so program cards and
 * the programme detail page show real images instead of an empty placeholder.
 *
 * Programme photos live in the unified `documents` table (category "photo",
 * public). The cover is derived from the first photo document and served via
 * `/api/documents/:id/download` — the SAME path real programme uploads use.
 *
 * Photos are uploaded through the SAME flow real uploads use: a presigned PUT
 * to the private object dir, then the normalized `/objects/...` path is stored
 * on the document row.
 *
 * If the database has no programmes yet (fresh demo data), a small set of demo
 * programmes is created first and any unlinked developer listings are attached
 * as projets so the surface looks complete.
 *
 * Idempotent: programmes that already have at least one photo document are
 * skipped, and demo programmes are only created when none exist, so the script
 * is safe to re-run.
 */
import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  db,
  programsTable,
  listingsTable,
  documentsTable,
  usersTable,
} from "@workspace/db";
import { eq, inArray, isNull, and } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";
import { buildListingSlug } from "../lib/slug";

// Pool of sample real-estate photos bundled with the api-server package.
// Order is "hero-first" so position 0 reads as a sensible cover.
const IMAGE_POOL = [
  "exterior_1.png",
  "balcony_1.png",
  "kitchen_1.png",
  "dining_1.png",
  "bathroom_1.png",
] as const;

const PHOTOS_PER_PROGRAM = 4;
const SEED_ASSETS_DIR = path.resolve(process.cwd(), "seed-assets");

// Demo programmes created only when the database has none yet.
const DEMO_PROGRAMS = [
  {
    title: "Résidence HaYarkon Tower",
    ville: "tlv",
    quartier: "Florentin",
    description:
      "Programme neuf haut de gamme au cœur de Tel Aviv : appartements lumineux avec vue, finitions premium, parking et espaces communs paysagers. Livraison prévue dans les meilleurs délais.",
  },
  {
    title: "Les Jardins de Netanya",
    ville: "nat",
    quartier: "Galei Yam",
    description:
      "Résidence familiale à deux pas de la mer à Netanya. Grands balcons, jardins partagés et prestations modernes pour un cadre de vie paisible et lumineux.",
  },
  {
    title: "Park Avenue Residences",
    ville: "jer",
    quartier: "Rehavia",
    description:
      "Adresse d'exception dans le quartier prisé de Rehavia à Jérusalem. Architecture en pierre, standing élevé et emplacement central recherché.",
  },
] as const;

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

async function findDeveloperOwnerId(): Promise<string | null> {
  const [byId] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, "seed-developer-001"))
    .limit(1);
  if (byId) return byId.id;

  const [byRole] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, "developer"))
    .limit(1);
  return byRole?.id ?? null;
}

async function uniqueProgramSlug(base: string): Promise<string> {
  const rows = await db
    .select({ slug: programsTable.slug })
    .from(programsTable);
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

async function createDemoPrograms(ownerId: string): Promise<number[]> {
  const createdIds: number[] = [];
  for (const demo of DEMO_PROGRAMS) {
    const slug = await uniqueProgramSlug(
      buildListingSlug(demo.title, demo.ville)
    );
    const [program] = await db
      .insert(programsTable)
      .values({
        ownerId,
        title: demo.title,
        slug,
        description: demo.description,
        ville: demo.ville,
        quartier: demo.quartier,
        status: "published",
      })
      .returning();
    createdIds.push(program.id);
    console.log(`Created demo programme #${program.id} "${program.title}"`);
  }

  // Attach the developer's unlinked listings as projets (round-robin) so the
  // programme detail page shows projets, not just photos.
  const unlinked = await db
    .select({ id: listingsTable.id })
    .from(listingsTable)
    .where(
      and(eq(listingsTable.ownerId, ownerId), isNull(listingsTable.programId))
    )
    .orderBy(listingsTable.id);

  for (let i = 0; i < unlinked.length; i++) {
    const programId = createdIds[i % createdIds.length];
    await db
      .update(listingsTable)
      .set({ programId })
      .where(eq(listingsTable.id, unlinked[i].id));
  }
  if (unlinked.length > 0) {
    console.log(
      `Linked ${unlinked.length} existing listing(s) as projets across ${createdIds.length} demo programme(s).`
    );
  }

  return createdIds;
}

async function main(): Promise<void> {
  const svc = new ObjectStorageService();

  let programs = await db
    .select({ id: programsTable.id, title: programsTable.title })
    .from(programsTable)
    .orderBy(programsTable.id);

  // Fresh demo data: no programmes exist yet. Create a small demo set.
  if (programs.length === 0) {
    const ownerId = await findDeveloperOwnerId();
    if (!ownerId) {
      console.log(
        "No programmes and no developer user found. Nothing to seed."
      );
      return;
    }
    console.log("No programmes found. Creating demo programmes...");
    await createDemoPrograms(ownerId);
    programs = await db
      .select({ id: programsTable.id, title: programsTable.title })
      .from(programsTable)
      .orderBy(programsTable.id);
  }

  // Skip programmes that already have a photo document so re-runs don't dup.
  const existing = await db
    .select({
      programId: documentsTable.programId,
      category: documentsTable.category,
    })
    .from(documentsTable)
    .where(
      inArray(
        documentsTable.programId,
        programs.map((p) => p.id)
      )
    );
  const alreadyHasPhotos = new Set(
    existing
      .filter((e) => e.category === "photo" && e.programId !== null)
      .map((e) => e.programId as number)
  );
  const todo = programs.filter((p) => !alreadyHasPhotos.has(p.id));

  if (todo.length === 0) {
    console.log(
      `All ${programs.length} programme(s) already have photos. Nothing to do.`
    );
    return;
  }

  console.log(
    `Uploading ${IMAGE_POOL.length} sample photo(s) to object storage...`
  );
  // Upload each distinct sample photo once, then reuse the stored paths across
  // programmes (rotated per programme so covers differ).
  const uploadedPaths: string[] = [];
  for (const file of IMAGE_POOL) {
    const bytes = await readFile(path.join(SEED_ASSETS_DIR, file));
    const objectPath = await uploadImage(svc, bytes);
    uploadedPaths.push(objectPath);
    console.log(`  ${file} -> ${objectPath}`);
  }

  // Owner per programme (documents must be owned by the programme owner).
  const owners = await db
    .select({ id: programsTable.id, ownerId: programsTable.ownerId })
    .from(programsTable)
    .where(
      inArray(
        programsTable.id,
        todo.map((p) => p.id)
      )
    );
  const ownerByProgram = new Map(owners.map((o) => [o.id, o.ownerId]));

  let totalDocs = 0;
  for (let i = 0; i < todo.length; i++) {
    const program = todo[i];
    const ownerId = ownerByProgram.get(program.id);
    if (!ownerId) continue;
    // Rotate the pool by programme index so cover photos vary.
    const rows = Array.from({ length: PHOTOS_PER_PROGRAM }, (_, pos) => {
      const idx = (i + pos) % uploadedPaths.length;
      return {
        ownerId,
        programId: program.id,
        category: "photo",
        visibility: "public",
        objectPath: uploadedPaths[idx],
        fileName: `photo-${pos + 1}.png`,
        mimeType: "image/png",
      };
    });
    await db.insert(documentsTable).values(rows);
    totalDocs += rows.length;
    console.log(
      `Seeded ${rows.length} photo(s) for programme #${program.id} "${program.title}"`
    );
  }

  console.log(
    `Done. Seeded ${totalDocs} photo document(s) across ${todo.length} programme(s).`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
