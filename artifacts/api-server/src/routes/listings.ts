import { Router } from "express";
import { db } from "@workspace/db";
import {
  listingsTable,
  listingImagesTable,
  favoritesTable,
  usersTable,
} from "@workspace/db";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";
import {
  ListListingsQueryParams,
  CreateListingBody,
  GetListingParams,
  UpdateListingBody,
  UpdateListingParams,
  DeleteListingParams,
  AddListingImageParams,
  AddListingImageBody,
  DeleteListingImageParams,
  PublishListingParams,
  AdminListListingsQueryParams,
  AdminUpdateListingStatusParams,
  AdminUpdateListingStatusBody,
} from "@workspace/api-zod";
import { calcEstimation, calcInvestmentScore } from "../lib/engine";
import { buildListingSlug } from "../lib/slug";

const router = Router();

// Generate a slug that is unique across listings, appending -2, -3, ... on collision.
async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const rows = await db
    .select({ id: listingsTable.id, slug: listingsTable.slug })
    .from(listingsTable)
    .where(
      sql`${listingsTable.slug} = ${base} OR ${listingsTable.slug} LIKE ${base + "-%"}`
    );
  const taken = new Set(
    rows.filter((r) => r.id !== excludeId).map((r) => r.slug)
  );
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function serializeListing(
  l: typeof listingsTable.$inferSelect,
  owner?: typeof usersTable.$inferSelect | null,
  coverImageUrl?: string | null
) {
  return {
    id: l.id,
    slug: l.slug,
    ownerId: l.ownerId,
    ownerName: owner
      ? owner.fullName ?? (owner.firstName && owner.lastName ? `${owner.firstName} ${owner.lastName}` : owner.firstName ?? null)
      : null,
    ownerAvatar: owner ? owner.avatarUrl ?? owner.profileImageUrl ?? null : null,
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
    coverImageUrl: coverImageUrl ?? null,
    createdAt: l.createdAt.toISOString(),
  };
}

// GET /listings
router.get("/listings", async (req, res): Promise<void> => {
  const params = ListListingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const {
    ville,
    type,
    minPrice,
    maxPrice,
    minSurface,
    maxSurface,
    nbPieces,
    status,
    ownerId,
    limit = 20,
    offset = 0,
  } = params.data;

  const conditions = [];
  // By default only show published listings to the public
  if (status) {
    conditions.push(eq(listingsTable.status, status));
  } else if (!ownerId) {
    conditions.push(eq(listingsTable.status, "published"));
  }
  if (ville) conditions.push(eq(listingsTable.ville, ville));
  if (type) conditions.push(eq(listingsTable.type, type));
  if (minPrice) conditions.push(gte(listingsTable.price, minPrice));
  if (maxPrice) conditions.push(lte(listingsTable.price, maxPrice));
  if (minSurface) conditions.push(gte(listingsTable.surface, minSurface));
  if (maxSurface) conditions.push(lte(listingsTable.surface, maxSurface));
  if (nbPieces) conditions.push(eq(listingsTable.nbPieces, nbPieces));
  if (ownerId) conditions.push(eq(listingsTable.ownerId, ownerId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [listings, totalResult] = await Promise.all([
    db
      .select()
      .from(listingsTable)
      .where(where)
      .orderBy(desc(listingsTable.createdAt))
      .limit(limit ?? 20)
      .offset(offset ?? 0),
    db.select({ count: count() }).from(listingsTable).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  // Get cover images
  const listingIds = listings.map((l) => l.id);
  let coverImages: Array<{ listingId: number; url: string }> = [];
  if (listingIds.length > 0) {
    coverImages = await db
      .select({ listingId: listingImagesTable.listingId, url: listingImagesTable.url })
      .from(listingImagesTable)
      .where(
        and(
          sql`${listingImagesTable.listingId} = ANY(ARRAY[${sql.join(listingIds.map((id) => sql`${id}`), sql`, `)}]::integer[])`,
          eq(listingImagesTable.position, 0)
        )
      );
  }
  const coverMap = new Map(coverImages.map((c) => [c.listingId, c.url]));

  res.json({
    listings: listings.map((l) => serializeListing(l, null, coverMap.get(l.id) ?? null)),
    total,
  });
});

// GET /listings/featured
router.get("/listings/featured", async (req, res): Promise<void> => {
  const listings = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.status, "published"))
    .orderBy(desc(listingsTable.investmentScore))
    .limit(6);

  const listingIds = listings.map((l) => l.id);
  let coverImages: Array<{ listingId: number; url: string }> = [];
  if (listingIds.length > 0) {
    coverImages = await db
      .select({ listingId: listingImagesTable.listingId, url: listingImagesTable.url })
      .from(listingImagesTable)
      .where(
        and(
          sql`${listingImagesTable.listingId} = ANY(ARRAY[${sql.join(listingIds.map((id) => sql`${id}`), sql`, `)}]::integer[])`,
          eq(listingImagesTable.position, 0)
        )
      );
  }
  const coverMap = new Map(coverImages.map((c) => [c.listingId, c.url]));

  res.json(listings.map((l) => serializeListing(l, null, coverMap.get(l.id) ?? null)));
});

// GET /listings/stats
router.get("/listings/stats", async (req, res): Promise<void> => {
  const [totalResult, byCityResult, byTypeResult, avgPriceResult] = await Promise.all([
    db.select({ count: count() }).from(listingsTable).where(eq(listingsTable.status, "published")),
    db
      .select({ ville: listingsTable.ville, count: count() })
      .from(listingsTable)
      .where(eq(listingsTable.status, "published"))
      .groupBy(listingsTable.ville),
    db
      .select({ type: listingsTable.type, count: count() })
      .from(listingsTable)
      .where(eq(listingsTable.status, "published"))
      .groupBy(listingsTable.type),
    db
      .select({ avg: sql<number>`COALESCE(AVG(${listingsTable.price}), 0)` })
      .from(listingsTable)
      .where(eq(listingsTable.status, "published")),
  ]);

  res.json({
    totalListings: totalResult[0]?.count ?? 0,
    byCity: byCityResult.map((r) => ({ ville: r.ville, count: r.count })),
    byType: byTypeResult.map((r) => ({ type: r.type, count: r.count })),
    avgPrice: Math.round(avgPriceResult[0]?.avg ?? 0),
  });
});

// GET /listings/:listingId
router.get("/listings/:listingId", async (req, res): Promise<void> => {
  const params = GetListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid listing identifier" });
    return;
  }

  // Resolve by slug first (canonical), then fall back to a numeric id for
  // legacy/back-compat links. Slug-first avoids ambiguity if a slug is numeric.
  const idOrSlug = String(params.data.listingId);

  let [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.slug, idOrSlug))
    .limit(1);

  if (!listing && /^\d+$/.test(idOrSlug)) {
    [listing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, parseInt(idOrSlug, 10)))
      .limit(1);
  }

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const [owner, images] = await Promise.all([
    db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, listing.ownerId))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(listingImagesTable)
      .where(eq(listingImagesTable.listingId, listing.id))
      .orderBy(listingImagesTable.position),
  ]);

  let isFavorited = false;
  if (req.isAuthenticated()) {
    const fav = await db
      .select()
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, req.user!.id),
          eq(favoritesTable.listingId, listing.id)
        )
      )
      .limit(1);
    isFavorited = fav.length > 0;
  }

  const coverImageUrl = images[0]?.url ?? null;

  res.json({
    listing: serializeListing(listing, owner, coverImageUrl),
    images: images.map((img) => ({
      id: img.id,
      listingId: img.listingId,
      url: img.url,
      position: img.position,
    })),
    isFavorited,
  });
});

// POST /listings
router.post("/listings", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const { estimatedPrice } = calcEstimation({
    ville: data.ville,
    surface: data.surface,
    nbPieces: data.nbPieces,
    etage: data.etage ?? null,
    type: data.type,
  });
  const { score: investmentScore } = calcInvestmentScore({
    ville: data.ville,
    type: data.type,
    price: data.price,
    estimatedPrice,
    surface: data.surface,
  });

  const slug = await uniqueSlug(buildListingSlug(data.title, data.ville));

  const [listing] = await db
    .insert(listingsTable)
    .values({
      ownerId: req.user!.id,
      type: data.type,
      title: data.title,
      slug,
      description: data.description ?? null,
      ville: data.ville,
      quartier: data.quartier ?? null,
      surface: data.surface,
      nbPieces: data.nbPieces,
      etage: data.etage ?? null,
      price: data.price,
      estimatedPrice,
      investmentScore,
      status: "draft",
    })
    .returning();

  res.status(201).json(serializeListing(listing, null, null));
});

// PATCH /listings/:listingId
router.patch("/listings/:listingId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = UpdateListingParams.safeParse(req.params);
  const parsed = UpdateListingBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [existing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, params.data.listingId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  if (existing.ownerId !== req.user!.id) {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (user[0]?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const updates: Record<string, unknown> = { ...parsed.data };

  // Recalculate engine values if price/location/size changed
  const needsRecalc =
    parsed.data.price !== undefined ||
    parsed.data.ville !== undefined ||
    parsed.data.surface !== undefined ||
    parsed.data.nbPieces !== undefined;

  if (needsRecalc) {
    const ville = parsed.data.ville ?? existing.ville;
    const surface = parsed.data.surface ?? existing.surface;
    const nbPieces = parsed.data.nbPieces ?? existing.nbPieces;
    const etage = parsed.data.etage ?? existing.etage;
    const type = parsed.data.type ?? existing.type;
    const price = parsed.data.price ?? existing.price;

    const { estimatedPrice } = calcEstimation({ ville, surface, nbPieces, etage, type });
    const { score: investmentScore } = calcInvestmentScore({
      ville,
      type,
      price,
      estimatedPrice,
      surface,
    });
    updates.estimatedPrice = estimatedPrice;
    updates.investmentScore = investmentScore;
  }

  // Regenerate the slug when the title or city changes (old URLs still resolve via id).
  if (parsed.data.title !== undefined || parsed.data.ville !== undefined) {
    const title = parsed.data.title ?? existing.title;
    const ville = parsed.data.ville ?? existing.ville;
    updates.slug = await uniqueSlug(buildListingSlug(title, ville), existing.id);
  }

  const [updated] = await db
    .update(listingsTable)
    .set(updates)
    .where(eq(listingsTable.id, params.data.listingId))
    .returning();

  res.json(serializeListing(updated, null, null));
});

// DELETE /listings/:listingId
router.delete("/listings/:listingId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = DeleteListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid listing ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, params.data.listingId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  if (existing.ownerId !== req.user!.id) {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (user[0]?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  await db.delete(listingsTable).where(eq(listingsTable.id, params.data.listingId));
  res.json({ success: true });
});

// POST /listings/:listingId/images
router.post("/listings/:listingId/images", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = AddListingImageParams.safeParse(req.params);
  const parsed = AddListingImageBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [img] = await db
    .insert(listingImagesTable)
    .values({
      listingId: params.data.listingId,
      url: parsed.data.url,
      position: parsed.data.position,
    })
    .returning();

  res.status(201).json({ id: img.id, listingId: img.listingId, url: img.url, position: img.position });
});

// DELETE /listings/:listingId/images/:imageId
router.delete("/listings/:listingId/images/:imageId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = DeleteListingImageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  await db
    .delete(listingImagesTable)
    .where(
      and(
        eq(listingImagesTable.id, params.data.imageId),
        eq(listingImagesTable.listingId, params.data.listingId)
      )
    );

  res.json({ success: true });
});

// POST /listings/:listingId/publish
router.post("/listings/:listingId/publish", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = PublishListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid listing ID" });
    return;
  }

  const [updated] = await db
    .update(listingsTable)
    .set({ status: "published" })
    .where(
      and(
        eq(listingsTable.id, params.data.listingId),
        eq(listingsTable.ownerId, req.user!.id)
      )
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Listing not found or not owned by you" });
    return;
  }

  res.json(serializeListing(updated, null, null));
});

// GET /admin/listings
router.get("/admin/listings", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = AdminListListingsQueryParams.safeParse(req.query);
  let query = db.select().from(listingsTable).$dynamic();
  if (params.success && params.data.status) {
    query = query.where(eq(listingsTable.status, params.data.status));
  }
  const listings = await query.orderBy(desc(listingsTable.createdAt)).limit(100);
  res.json(listings.map((l) => serializeListing(l, null, null)));
});

// PATCH /admin/listings/:listingId/status
router.patch("/admin/listings/:listingId/status", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = AdminUpdateListingStatusParams.safeParse(req.params);
  const parsed = AdminUpdateListingStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [updated] = await db
    .update(listingsTable)
    .set({ status: parsed.data.status })
    .where(eq(listingsTable.id, params.data.listingId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  res.json(serializeListing(updated, null, null));
});

export default router;
