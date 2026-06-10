import { Router } from "express";
import { db } from "@workspace/db";
import {
  demolitionListingsTable,
  demolitionDocumentsTable,
  demolitionOffersTable,
  usersTable,
} from "@workspace/db";
import { eq, and, desc, or, sql } from "drizzle-orm";
import {
  CreateDemolitionListingBody,
  GetDemolitionListingParams,
  UpdateDemolitionListingStatusParams,
  UpdateDemolitionListingStatusBody,
  ListDemolitionOffersParams,
  CreateDemolitionOfferParams,
  CreateDemolitionOfferBody,
  ListDemolitionListingsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware";
import { sendNewOfferEmail } from "../lib/email";

const router = Router();

type ListingRow = typeof demolitionListingsTable.$inferSelect;
type DocumentRow = typeof demolitionDocumentsTable.$inferSelect;
type OfferRow = typeof demolitionOffersTable.$inferSelect;
type UserRow = typeof usersTable.$inferSelect;

function serializeListing(listing: ListingRow, offerCount = 0, includeContact = false) {
  return {
    id: listing.id,
    address: listing.address,
    city: listing.city,
    units: listing.units,
    buildYear: listing.buildYear,
    projectType: listing.projectType,
    ownerName: listing.ownerName,
    ownerEmail: includeContact ? listing.ownerEmail : null,
    ownerPhone: includeContact ? listing.ownerPhone : null,
    status: listing.status,
    isPaid: listing.isPaid,
    offerCount,
    createdAt: listing.createdAt.toISOString(),
  };
}

function serializeDocument(doc: DocumentRow) {
  return {
    id: doc.id,
    listingId: doc.listingId,
    url: doc.url,
    name: doc.name,
    position: doc.position,
  };
}

function serializeOffer(offer: OfferRow, promoter?: UserRow | null) {
  return {
    id: offer.id,
    listingId: offer.listingId,
    promoterId: offer.promoterId,
    promoterName: promoter
      ? promoter.fullName ??
        (promoter.firstName && promoter.lastName
          ? `${promoter.firstName} ${promoter.lastName}`
          : promoter.firstName ?? null)
      : null,
    promoterEmail: promoter?.email ?? null,
    promoterCompany: promoter?.company ?? null,
    pricePerUnit: offer.pricePerUnit,
    newUnitsOffer: offer.newUnitsOffer,
    timeline: offer.timeline,
    message: offer.message,
    createdAt: offer.createdAt.toISOString(),
  };
}

async function countOffers(listingIds: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (listingIds.length === 0) return map;
  const rows = await db
    .select({
      listingId: demolitionOffersTable.listingId,
      count: sql<number>`count(*)::int`,
    })
    .from(demolitionOffersTable)
    .where(
      sql`${demolitionOffersTable.listingId} = ANY(ARRAY[${sql.join(
        listingIds.map((id) => sql`${id}`),
        sql`, `,
      )}]::integer[])`,
    )
    .groupBy(demolitionOffersTable.listingId);
  for (const row of rows) map.set(row.listingId, Number(row.count));
  return map;
}

async function getRole(userId: string): Promise<string | undefined> {
  const rows = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return rows[0]?.role ?? undefined;
}

// GET /demolition/listings — public browse of active buildings
router.get("/demolition/listings", async (req, res): Promise<void> => {
  const query = ListDemolitionListingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const conditions = [eq(demolitionListingsTable.status, "active")];
  if (query.data.city) {
    conditions.push(eq(demolitionListingsTable.city, query.data.city));
  }
  if (query.data.projectType) {
    conditions.push(eq(demolitionListingsTable.projectType, query.data.projectType));
  }
  if (query.data.minUnits != null) {
    conditions.push(sql`${demolitionListingsTable.units} >= ${query.data.minUnits}`);
  }

  const listings = await db
    .select()
    .from(demolitionListingsTable)
    .where(and(...conditions))
    .orderBy(desc(demolitionListingsTable.createdAt))
    .limit(200);

  const counts = await countOffers(listings.map((l) => l.id));
  res.json(listings.map((l) => serializeListing(l, counts.get(l.id) ?? 0)));
});

// GET /demolition/mine — current user's registered buildings (with offer counts)
router.get("/demolition/mine", requireAuth, async (req, res): Promise<void> => {
  const listings = await db
    .select()
    .from(demolitionListingsTable)
    .where(eq(demolitionListingsTable.ownerId, req.user!.id))
    .orderBy(desc(demolitionListingsTable.createdAt));

  const ids = listings.map((l) => l.id);
  const counts = await countOffers(ids);
  const docs = ids.length
    ? await db
        .select()
        .from(demolitionDocumentsTable)
        .where(
          sql`${demolitionDocumentsTable.listingId} = ANY(ARRAY[${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `,
          )}]::integer[])`,
        )
        .orderBy(demolitionDocumentsTable.listingId, demolitionDocumentsTable.position)
    : [];
  const docMap = new Map<number, DocumentRow[]>();
  for (const d of docs) {
    const arr = docMap.get(d.listingId) ?? [];
    arr.push(d);
    docMap.set(d.listingId, arr);
  }

  res.json(
    listings.map((l) => ({
      listing: serializeListing(l, counts.get(l.id) ?? 0, true),
      documents: (docMap.get(l.id) ?? []).map(serializeDocument),
    })),
  );
});

// GET /demolition/admin/listings — all listings (admin moderation)
router.get(
  "/demolition/admin/listings",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const listings = await db
      .select()
      .from(demolitionListingsTable)
      .orderBy(desc(demolitionListingsTable.createdAt))
      .limit(500);
    const counts = await countOffers(listings.map((l) => l.id));
    res.json(listings.map((l) => serializeListing(l, counts.get(l.id) ?? 0, true)));
  },
);

// POST /demolition/listings — register a building (any authenticated user)
router.post("/demolition/listings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDemolitionListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { documents, ...listingData } = parsed.data;

  const [listing] = await db
    .insert(demolitionListingsTable)
    .values({
      ownerId: req.user!.id,
      address: listingData.address,
      city: listingData.city,
      units: listingData.units,
      buildYear: listingData.buildYear,
      projectType: listingData.projectType,
      ownerName: listingData.ownerName,
      ownerEmail: listingData.ownerEmail,
      ownerPhone: listingData.ownerPhone,
      status: "pending",
      isPaid: false,
    })
    .returning();

  let docRows: DocumentRow[] = [];
  if (documents && documents.length > 0) {
    docRows = await db
      .insert(demolitionDocumentsTable)
      .values(
        documents.map((d, i) => ({
          listingId: listing.id,
          url: d.url,
          name: d.name,
          position: d.position ?? i,
        })),
      )
      .returning();
  }

  res.status(201).json({
    listing: serializeListing(listing, 0, true),
    documents: docRows.map(serializeDocument),
  });
});

// GET /demolition/listings/:listingId — detail with documents
router.get("/demolition/listings/:listingId", async (req, res): Promise<void> => {
  const params = GetDemolitionListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid listing ID" });
    return;
  }

  const [listing] = await db
    .select()
    .from(demolitionListingsTable)
    .where(eq(demolitionListingsTable.id, params.data.listingId))
    .limit(1);

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  // Only the owner or an admin may see the owner's private contact details.
  let includeContact = false;
  if (req.isAuthenticated()) {
    if (req.user!.id === listing.ownerId) {
      includeContact = true;
    } else if ((await getRole(req.user!.id)) === "admin") {
      includeContact = true;
    }
  }

  const [documents, counts] = await Promise.all([
    db
      .select()
      .from(demolitionDocumentsTable)
      .where(eq(demolitionDocumentsTable.listingId, listing.id))
      .orderBy(demolitionDocumentsTable.position),
    countOffers([listing.id]),
  ]);

  res.json({
    listing: serializeListing(listing, counts.get(listing.id) ?? 0, includeContact),
    documents: documents.map(serializeDocument),
  });
});

// PATCH /demolition/listings/:listingId — admin moderation (status / payment)
router.patch(
  "/demolition/listings/:listingId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateDemolitionListingStatusParams.safeParse(req.params);
    const parsed = UpdateDemolitionListingStatusBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const updates: Partial<typeof demolitionListingsTable.$inferInsert> = {};
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.isPaid !== undefined) updates.isPaid = parsed.data.isPaid;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [updated] = await db
      .update(demolitionListingsTable)
      .set(updates)
      .where(eq(demolitionListingsTable.id, params.data.listingId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    const [documents, counts] = await Promise.all([
      db
        .select()
        .from(demolitionDocumentsTable)
        .where(eq(demolitionDocumentsTable.listingId, updated.id))
        .orderBy(demolitionDocumentsTable.position),
      countOffers([updated.id]),
    ]);

    res.json({
      listing: serializeListing(updated, counts.get(updated.id) ?? 0, true),
      documents: documents.map(serializeDocument),
    });
  },
);

// GET /demolition/listings/:listingId/offers — owner or admin only
router.get(
  "/demolition/listings/:listingId/offers",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListDemolitionOffersParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid listing ID" });
      return;
    }

    const [listing] = await db
      .select()
      .from(demolitionListingsTable)
      .where(eq(demolitionListingsTable.id, params.data.listingId))
      .limit(1);

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    const isOwner = listing.ownerId === req.user!.id;
    const isAdmin = (await getRole(req.user!.id)) === "admin";
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const offers = await db
      .select()
      .from(demolitionOffersTable)
      .where(eq(demolitionOffersTable.listingId, listing.id))
      .orderBy(desc(demolitionOffersTable.createdAt));

    const promoterIds = [...new Set(offers.map((o) => o.promoterId))];
    const promoters = promoterIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(or(...promoterIds.map((id) => eq(usersTable.id, id))))
      : [];
    const promoterMap = new Map(promoters.map((p) => [p.id, p]));

    res.json(offers.map((o) => serializeOffer(o, promoterMap.get(o.promoterId))));
  },
);

// POST /demolition/listings/:listingId/offers — promoters (developers) only
router.post(
  "/demolition/listings/:listingId/offers",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = CreateDemolitionOfferParams.safeParse(req.params);
    const parsed = CreateDemolitionOfferBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const role = await getRole(req.user!.id);
    if (role !== "developer" && role !== "admin") {
      res.status(403).json({ error: "Only promoters can submit offers" });
      return;
    }

    const [listing] = await db
      .select()
      .from(demolitionListingsTable)
      .where(eq(demolitionListingsTable.id, params.data.listingId))
      .limit(1);

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    const [offer] = await db
      .insert(demolitionOffersTable)
      .values({
        listingId: listing.id,
        promoterId: req.user!.id,
        pricePerUnit: parsed.data.pricePerUnit,
        newUnitsOffer: parsed.data.newUnitsOffer,
        timeline: parsed.data.timeline,
        message: parsed.data.message,
      })
      .returning();

    const [promoter] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);

    // Best-effort owner notification — never block the response on email.
    void sendNewOfferEmail({
      ownerName: listing.ownerName,
      ownerEmail: listing.ownerEmail,
      buildingAddress: listing.address,
      buildingCity: listing.city,
      promoterName: promoter
        ? promoter.fullName ??
          (promoter.firstName && promoter.lastName
            ? `${promoter.firstName} ${promoter.lastName}`
            : promoter.firstName ?? null)
        : null,
      promoterCompany: promoter?.company ?? null,
      pricePerUnit: offer.pricePerUnit,
      newUnitsOffer: offer.newUnitsOffer,
      timeline: offer.timeline,
      message: offer.message,
    });

    res.status(201).json(serializeOffer(offer, promoter));
  },
);

export default router;
