import { Router } from "express";
import { db } from "@workspace/db";
import {
  programsTable,
  listingsTable,
  listingImagesTable,
  documentsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  ListProgramsQueryParams,
  CreateProgramBody,
  GetProgramParams,
  UpdateProgramParams,
  UpdateProgramBody,
  DeleteProgramParams,
  PublishProgramParams,
} from "@workspace/api-zod";
import { buildListingSlug } from "../lib/slug";
import { serializeDocument, isAdmin } from "../lib/documents";

const router = Router();

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const rows = await db
    .select({ id: programsTable.id, slug: programsTable.slug })
    .from(programsTable)
    .where(
      sql`${programsTable.slug} = ${base} OR ${programsTable.slug} LIKE ${base + "-%"}`
    );
  const taken = new Set(
    rows.filter((r) => r.id !== excludeId).map((r) => r.slug)
  );
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function serializeProgram(
  p: typeof programsTable.$inferSelect,
  owner?: typeof usersTable.$inferSelect | null,
  coverImageUrl?: string | null,
  projetsCount?: number
) {
  return {
    id: p.id,
    ownerId: p.ownerId,
    ownerName: owner
      ? owner.fullName ??
        (owner.firstName && owner.lastName
          ? `${owner.firstName} ${owner.lastName}`
          : owner.firstName ?? null)
      : null,
    slug: p.slug,
    title: p.title,
    description: p.description ?? null,
    ville: p.ville,
    quartier: p.quartier ?? null,
    status: p.status,
    coverImageUrl: coverImageUrl ?? null,
    projetsCount: projetsCount ?? 0,
    createdAt: p.createdAt.toISOString(),
  };
}

// Cover image for a programme = first photo document, else first projet cover.
async function coverForProgram(programId: number): Promise<string | null> {
  const [photo] = await db
    .select()
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.programId, programId),
        eq(documentsTable.category, "photo")
      )
    )
    .orderBy(documentsTable.createdAt)
    .limit(1);
  if (photo) return `/api/documents/${photo.id}/download`;
  return null;
}

// GET /programs
router.get("/programs", async (req, res): Promise<void> => {
  const params = ListProgramsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { ownerId, status } = params.data;

  const viewerId = req.isAuthenticated() ? req.user!.id : null;
  const viewerIsAdmin = viewerId !== null ? await isAdmin(viewerId) : false;
  // A viewer may see non-published programmes only for their own listing,
  // or if they are an admin. Everyone else is restricted to published.
  const canSeeAllStatuses =
    viewerIsAdmin || (ownerId != null && viewerId !== null && viewerId === ownerId);

  const conditions = [];
  if (ownerId) conditions.push(eq(programsTable.ownerId, ownerId));
  if (canSeeAllStatuses) {
    if (status) conditions.push(eq(programsTable.status, status));
  } else {
    conditions.push(eq(programsTable.status, "published"));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const programs = await db
    .select()
    .from(programsTable)
    .where(where)
    .orderBy(desc(programsTable.createdAt))
    .limit(100);

  const result = await Promise.all(
    programs.map(async (p) => {
      const [countRow] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(listingsTable)
        .where(eq(listingsTable.programId, p.id));
      const cover = await coverForProgram(p.id);
      return serializeProgram(p, null, cover, countRow?.c ?? 0);
    })
  );

  res.json(result);
});

// POST /programs
router.post("/programs", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = CreateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const slug = await uniqueSlug(buildListingSlug(data.title, data.ville));

  const [program] = await db
    .insert(programsTable)
    .values({
      ownerId: req.user!.id,
      title: data.title,
      slug,
      description: data.description ?? null,
      ville: data.ville,
      quartier: data.quartier ?? null,
      status: "draft",
    })
    .returning();

  res.status(201).json(serializeProgram(program, null, null, 0));
});

// GET /programs/:programId
router.get("/programs/:programId", async (req, res): Promise<void> => {
  const params = GetProgramParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid programme identifier" });
    return;
  }
  const idOrSlug = String(params.data.programId);

  let [program] = await db
    .select()
    .from(programsTable)
    .where(eq(programsTable.slug, idOrSlug))
    .limit(1);

  if (!program && /^\d+$/.test(idOrSlug)) {
    [program] = await db
      .select()
      .from(programsTable)
      .where(eq(programsTable.id, parseInt(idOrSlug, 10)))
      .limit(1);
  }

  if (!program) {
    res.status(404).json({ error: "Programme not found" });
    return;
  }

  const viewerId = req.isAuthenticated() ? req.user!.id : null;
  const viewerIsAdmin = viewerId ? await isAdmin(viewerId) : false;
  const canSeePrivate =
    viewerIsAdmin || (viewerId !== null && viewerId === program.ownerId);

  // Draft programmes are visible only to their owner or an admin.
  if (program.status !== "published" && !canSeePrivate) {
    res.status(404).json({ error: "Programme not found" });
    return;
  }

  const [owner, projets, docs] = await Promise.all([
    db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, program.ownerId))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(listingsTable)
      .where(
        canSeePrivate
          ? eq(listingsTable.programId, program.id)
          : and(
              eq(listingsTable.programId, program.id),
              eq(listingsTable.status, "published")
            )
      )
      .orderBy(desc(listingsTable.createdAt)),
    db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.programId, program.id))
      .orderBy(documentsTable.createdAt),
  ]);

  // Gallery images for projets (all photos, ordered by position; cover = first)
  const projetIds = projets.map((l) => l.id);
  let projetImages: Array<{ listingId: number; url: string }> = [];
  if (projetIds.length > 0) {
    projetImages = await db
      .select({
        listingId: listingImagesTable.listingId,
        url: listingImagesTable.url,
      })
      .from(listingImagesTable)
      .where(
        sql`${listingImagesTable.listingId} = ANY(ARRAY[${sql.join(projetIds.map((id) => sql`${id}`), sql`, `)}]::integer[])`
      )
      .orderBy(listingImagesTable.listingId, listingImagesTable.position);
  }
  const galleryMap = new Map<number, string[]>();
  for (const img of projetImages) {
    const existing = galleryMap.get(img.listingId);
    if (existing) existing.push(img.url);
    else galleryMap.set(img.listingId, [img.url]);
  }

  const visibleDocs = docs.filter(
    (d) => d.visibility === "public" || canSeePrivate
  );

  const cover = await coverForProgram(program.id);

  res.json({
    program: serializeProgram(program, owner, cover, projets.length),
    projets: projets.map((l) => ({
      id: l.id,
      slug: l.slug,
      ownerId: l.ownerId,
      programId: l.programId ?? null,
      ownerName: null,
      ownerAvatar: null,
      type: l.type,
      title: l.title,
      description: l.description ?? null,
      ville: l.ville,
      quartier: l.quartier ?? null,
      surface: l.surface,
      nbPieces: l.nbPieces,
      etage: l.etage ?? null,
      price: l.price,
      estimatedPrice: l.estimatedPrice ?? null,
      investmentScore: l.investmentScore ?? null,
      status: l.status,
      coverImageUrl: galleryMap.get(l.id)?.[0] ?? null,
      galleryImageUrls: galleryMap.get(l.id) ?? [],
      createdAt: l.createdAt.toISOString(),
    })),
    documents: visibleDocs.map(serializeDocument),
  });
});

// PATCH /programs/:programId
router.patch("/programs/:programId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = UpdateProgramParams.safeParse(req.params);
  const parsed = UpdateProgramBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [existing] = await db
    .select()
    .from(programsTable)
    .where(eq(programsTable.id, params.data.programId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Programme not found" });
    return;
  }

  if (existing.ownerId !== req.user!.id && !(await isAdmin(req.user!.id))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.title !== undefined || parsed.data.ville !== undefined) {
    const title = parsed.data.title ?? existing.title;
    const ville = parsed.data.ville ?? existing.ville;
    updates.slug = await uniqueSlug(buildListingSlug(title, ville), existing.id);
  }

  const [updated] = await db
    .update(programsTable)
    .set(updates)
    .where(eq(programsTable.id, params.data.programId))
    .returning();

  res.json(serializeProgram(updated, null, null));
});

// DELETE /programs/:programId
router.delete("/programs/:programId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = DeleteProgramParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid programme ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(programsTable)
    .where(eq(programsTable.id, params.data.programId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Programme not found" });
    return;
  }

  if (existing.ownerId !== req.user!.id && !(await isAdmin(req.user!.id))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(programsTable).where(eq(programsTable.id, params.data.programId));
  res.json({ success: true });
});

// POST /programs/:programId/publish
router.post("/programs/:programId/publish", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = PublishProgramParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid programme ID" });
    return;
  }

  const [updated] = await db
    .update(programsTable)
    .set({ status: "published" })
    .where(
      and(
        eq(programsTable.id, params.data.programId),
        eq(programsTable.ownerId, req.user!.id)
      )
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Programme not found or not owned by you" });
    return;
  }

  res.json(serializeProgram(updated, null, null));
});

export default router;
