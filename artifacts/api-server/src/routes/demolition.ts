import { Router } from "express";
import { db } from "@workspace/db";
import {
  demolitionListingsTable,
  demolitionDocumentsTable,
  demolitionOffersTable,
  demolitionConnectionsTable,
  usersTable,
  profilesTable,
} from "@workspace/db";
import { eq, and, desc, or, sql, ne } from "drizzle-orm";
import {
  CreateDemolitionListingBody,
  GetDemolitionListingParams,
  UpdateDemolitionListingStatusParams,
  UpdateDemolitionListingStatusBody,
  ListDemolitionOffersParams,
  CreateDemolitionOfferParams,
  CreateDemolitionOfferBody,
  ListDemolitionListingsQueryParams,
  ListDemolitionConnectionsParams,
  CreateDemolitionConnectionParams,
  CreateDemolitionConnectionBody,
  UpdateDemolitionConnectionStatusParams,
  UpdateDemolitionConnectionStatusBody,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware";
import {
  sendNewOfferEmail,
  sendConnectionValidatedEmail,
  sendOfferAcceptedEmail,
  sendOfferRejectedEmail,
  sendResaleMandateEmail,
} from "../lib/email";
import { geocodeAddress, fuzzCoords, APPROX_RADIUS_M } from "../lib/geocode";

const router = Router();

type ListingRow = typeof demolitionListingsTable.$inferSelect;
type DocumentRow = typeof demolitionDocumentsTable.$inferSelect;
type OfferRow = typeof demolitionOffersTable.$inferSelect;
type ConnectionRow = typeof demolitionConnectionsTable.$inferSelect;
type UserRow = typeof usersTable.$inferSelect;

/**
 * Serialize a listing. `reveal` controls disclosure of the PRIVATE address,
 * exact coordinates, and owner identity/contact: true only for the owner, an
 * admin, or a promoter whose connection has been validated. Everyone else sees
 * the neighborhood + fuzzed approximate circle, never the exact location.
 */
function serializeListing(
  listing: ListingRow,
  offerCount = 0,
  reveal = false,
  isOwner = false,
  extra: { isWinningPromoter?: boolean; resaleAgentName?: string | null } = {},
) {
  return {
    id: listing.id,
    address: reveal ? listing.address : null,
    city: listing.city,
    neighborhood: listing.neighborhood,
    lat: reveal ? listing.lat : null,
    lng: reveal ? listing.lng : null,
    approxLat: listing.approxLat,
    approxLng: listing.approxLng,
    approxRadiusM: APPROX_RADIUS_M,
    isAddressRevealed: reveal,
    isOwner,
    units: listing.units,
    buildYear: listing.buildYear,
    projectType: listing.projectType,
    ownerName: reveal ? listing.ownerName : null,
    ownerEmail: reveal ? listing.ownerEmail : null,
    ownerPhone: reveal ? listing.ownerPhone : null,
    status: listing.status,
    acceptedOfferId: listing.acceptedOfferId,
    // Resale mandate (set once the winning promoter mandates an agence).
    resaleAgentId: listing.resaleAgentId,
    resaleStatus: listing.resaleStatus,
    resaleAgentName: extra.resaleAgentName ?? null,
    // True only when the authenticated viewer is the promoter of the accepted
    // offer — gates the "mandate an agence for resale" action on the frontend.
    isWinningPromoter: extra.isWinningPromoter ?? false,
    isPaid: listing.isPaid,
    offerCount,
    createdAt: listing.createdAt.toISOString(),
  };
}

function promoterDisplayName(promoter?: UserRow | null): string | null {
  if (!promoter) return null;
  return (
    promoter.fullName ??
    (promoter.firstName && promoter.lastName
      ? `${promoter.firstName} ${promoter.lastName}`
      : promoter.firstName ?? null)
  );
}

function serializeConnection(
  conn: ConnectionRow,
  opts: {
    promoter?: UserRow | null;
    listing?: ListingRow | null;
    includeAddress?: boolean;
  } = {},
) {
  const { promoter, listing, includeAddress } = opts;
  return {
    id: conn.id,
    listingId: conn.listingId,
    promoterId: conn.promoterId,
    offerId: conn.offerId,
    status: conn.status,
    commissionStatus: conn.commissionStatus,
    validatedAt: conn.validatedAt ? conn.validatedAt.toISOString() : null,
    createdAt: conn.createdAt.toISOString(),
    promoterName: promoterDisplayName(promoter),
    promoterEmail: promoter?.email ?? null,
    promoterCompany: promoter?.company ?? null,
    listingCity: listing?.city ?? null,
    listingNeighborhood: listing?.neighborhood ?? null,
    listingAddress: includeAddress ? listing?.address ?? null : null,
    ownerName: listing?.ownerName ?? null,
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

interface OfferScores {
  score: number;
  scoreFinancial: number;
  scoreQuality: number;
  scoreTimeline: number;
  scoreReferences: number;
}

function serializeOffer(
  offer: OfferRow,
  promoter?: UserRow | null,
  scores?: OfferScores | null,
  connectionStatus: string | null = null,
) {
  return {
    id: offer.id,
    listingId: offer.listingId,
    promoterId: offer.promoterId,
    status: offer.status, // 'pending' | 'accepted' | 'rejected'
    promoterName: promoterDisplayName(promoter),
    promoterEmail: promoter?.email ?? null,
    promoterCompany: promoter?.company ?? null,
    // Financial
    pricePerUnit: offer.pricePerUnit,
    newUnitArea: offer.newUnitArea,
    newUnitsOffer: offer.newUnitsOffer,
    estimatedDeliveredValue: offer.estimatedDeliveredValue,
    // Qualitative
    standing: offer.standing,
    materials: offer.materials,
    floors: offer.floors,
    parkingPerUnit: offer.parkingPerUnit,
    elevator: offer.elevator,
    bikeStorage: offer.bikeStorage,
    gym: offer.gym,
    lobby: offer.lobby,
    replacementHousing: offer.replacementHousing,
    replacementHousingQuality: offer.replacementHousingQuality,
    // Timeline & security
    constructionDurationMonths: offer.constructionDurationMonths,
    startDelayMonths: offer.startDelayMonths,
    bankGuarantee: offer.bankGuarantee,
    projectReferences: offer.projectReferences,
    message: offer.message,
    // Computed comparison score (only present when computed across a listing's offers)
    score: scores?.score ?? null,
    scoreFinancial: scores?.scoreFinancial ?? null,
    scoreQuality: scores?.scoreQuality ?? null,
    scoreTimeline: scores?.scoreTimeline ?? null,
    scoreReferences: scores?.scoreReferences ?? null,
    connectionStatus,
    createdAt: offer.createdAt.toISOString(),
  };
}

const STANDING_SCORE: Record<string, number> = {
  standard: 0.34,
  high_end: 0.67,
  luxury: 1,
};

/**
 * Compute a weighted comparison score (0-100) for every offer on a listing.
 * Weights: 40% financial, 30% quality, 20% timeline, 10% references.
 *
 * Each criterion is normalized *relative to the other offers on the same listing*
 * so the score answers "how does this offer compare to its competitors?". For
 * "higher is better" metrics we divide by the best value; for "lower is better"
 * delays we use min-max normalization so the fastest offer scores 1 and the
 * slowest 0 (a start delay of 0 = "immediate" is therefore rewarded, not
 * penalized). When every offer ties on a metric it scores 1. With a single
 * offer every relative metric is 1, so the score reflects only its absolute
 * boolean/standing merits scaled against a lone competitor.
 */
function computeOfferScores(offers: OfferRow[]): Map<number, OfferScores> {
  const result = new Map<number, OfferScores>();
  if (offers.length === 0) return result;

  const max = (fn: (o: OfferRow) => number) =>
    Math.max(0, ...offers.map(fn));
  const min = (fn: (o: OfferRow) => number) =>
    Math.min(...offers.map(fn));

  const maxPrice = max((o) => o.pricePerUnit);
  const maxArea = max((o) => o.newUnitArea);
  const maxUnits = max((o) => o.newUnitsOffer);
  const maxValue = max((o) => o.estimatedDeliveredValue);
  const maxFloors = max((o) => o.floors);
  const maxParking = max((o) => o.parkingPerUnit);
  const minDuration = min((o) => o.constructionDurationMonths);
  const maxDuration = max((o) => o.constructionDurationMonths);
  const minStart = min((o) => o.startDelayMonths);
  const maxStart = max((o) => o.startDelayMonths);

  const ratio = (v: number, m: number) => (m > 0 ? v / m : 0);
  // Lower-is-better via min-max: smallest value scores 1, largest 0; all-equal scores 1.
  const lowerBetter = (v: number, lo: number, hi: number) =>
    hi > lo ? (hi - v) / (hi - lo) : 1;

  for (const o of offers) {
    // Financial (avg of 4 normalized metrics)
    const financial =
      (ratio(o.pricePerUnit, maxPrice) +
        ratio(o.newUnitArea, maxArea) +
        ratio(o.newUnitsOffer, maxUnits) +
        ratio(o.estimatedDeliveredValue, maxValue)) /
      4;

    // Quality (standing + floors + parking + amenities + replacement housing)
    const amenities =
      (Number(o.elevator) +
        Number(o.bikeStorage) +
        Number(o.gym) +
        Number(o.lobby)) /
      4;
    const quality =
      ((STANDING_SCORE[o.standing] ?? 0.34) +
        ratio(o.floors, maxFloors) +
        ratio(o.parkingPerUnit, maxParking) +
        amenities +
        Number(o.replacementHousing)) /
      5;

    // Timeline & security (shorter duration + shorter start delay + bank guarantee)
    const timeline =
      (lowerBetter(o.constructionDurationMonths, minDuration, maxDuration) +
        lowerBetter(o.startDelayMonths, minStart, maxStart) +
        Number(o.bankGuarantee)) /
      3;

    // References (presence of past-project references)
    const references = o.projectReferences && o.projectReferences.trim() ? 1 : 0;

    const scoreFinancial = Math.round(financial * 40);
    const scoreQuality = Math.round(quality * 30);
    const scoreTimeline = Math.round(timeline * 20);
    const scoreReferences = Math.round(references * 10);

    result.set(o.id, {
      scoreFinancial,
      scoreQuality,
      scoreTimeline,
      scoreReferences,
      score: scoreFinancial + scoreQuality + scoreTimeline + scoreReferences,
    });
  }

  return result;
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

// Resolve an agence's display name: its B2B profile company name (matched by
// email), falling back to the auth user's name or email. Used wherever a
// mandated resale agence must be shown.
async function resolveAgenceName(userId: string): Promise<string | null> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return null;
  const [prof] = await db
    .select({ companyName: profilesTable.companyName })
    .from(profilesTable)
    .where(eq(profilesTable.email, user.email))
    .limit(1);
  return prof?.companyName ?? promoterDisplayName(user) ?? user.email;
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
      listing: serializeListing(l, counts.get(l.id) ?? 0, true, true),
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

  // Best-effort geocode of the exact address. Geocoding failures must never
  // block listing creation.
  const exact = await geocodeAddress(listingData.address, listingData.city);

  let [listing] = await db
    .insert(demolitionListingsTable)
    .values({
      ownerId: req.user!.id,
      address: listingData.address,
      city: listingData.city,
      neighborhood: listingData.neighborhood ?? null,
      lat: exact?.lat ?? null,
      lng: exact?.lng ?? null,
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

  // Derive the public fuzzed center using the listing id as a deterministic seed.
  if (exact) {
    const approx = fuzzCoords(exact.lat, exact.lng, listing.id);
    const [withApprox] = await db
      .update(demolitionListingsTable)
      .set({ approxLat: approx.lat, approxLng: approx.lng })
      .where(eq(demolitionListingsTable.id, listing.id))
      .returning();
    if (withApprox) listing = withApprox;
  }

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
    listing: serializeListing(listing, 0, true, true),
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

  let [listing] = await db
    .select()
    .from(demolitionListingsTable)
    .where(eq(demolitionListingsTable.id, params.data.listingId))
    .limit(1);

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  // The exact address, coordinates, and owner identity are revealed ONLY to the
  // owner, an admin, or a promoter whose connection has been validated by admin.
  let reveal = false;
  let isOwnerOrAdmin = false;
  let isViewerOwner = false;
  let isWinningPromoter = false;
  if (req.isAuthenticated()) {
    if (req.user!.id === listing.ownerId) {
      reveal = true;
      isOwnerOrAdmin = true;
      isViewerOwner = true;
    } else if ((await getRole(req.user!.id)) === "admin") {
      reveal = true;
      isOwnerOrAdmin = true;
    } else {
      const [conn] = await db
        .select()
        .from(demolitionConnectionsTable)
        .where(
          and(
            eq(demolitionConnectionsTable.listingId, listing.id),
            eq(demolitionConnectionsTable.promoterId, req.user!.id),
            eq(demolitionConnectionsTable.status, "validated"),
          ),
        )
        .limit(1);
      if (conn) reveal = true;
    }
  }

  // The winning promoter (promoter of the accepted offer) keeps access to their
  // won project even before the connection is admin-validated, so they can reach
  // the resale-mandate action. The exact address stays gated by `reveal` until an
  // admin validates the connection.
  if (req.isAuthenticated() && listing.acceptedOfferId) {
    const [accepted] = await db
      .select({ promoterId: demolitionOffersTable.promoterId })
      .from(demolitionOffersTable)
      .where(eq(demolitionOffersTable.id, listing.acceptedOfferId))
      .limit(1);
    if (accepted && accepted.promoterId === req.user!.id) isWinningPromoter = true;
  }

  // Non-active listings (pending / offer_locked / closed) are only visible to
  // their owner, an admin, the winning promoter, or a promoter whose connection
  // is validated.
  if (
    listing.status !== "active" &&
    !isOwnerOrAdmin &&
    !reveal &&
    !isWinningPromoter
  ) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  // Lazy geocode backfill for listings created before coordinates existed.
  if (listing.approxLat == null || listing.approxLng == null) {
    const exact = await geocodeAddress(listing.address, listing.city);
    if (exact) {
      const approx = fuzzCoords(exact.lat, exact.lng, listing.id);
      const [refreshed] = await db
        .update(demolitionListingsTable)
        .set({
          lat: exact.lat,
          lng: exact.lng,
          approxLat: approx.lat,
          approxLng: approx.lng,
        })
        .where(eq(demolitionListingsTable.id, listing.id))
        .returning();
      if (refreshed) listing = refreshed;
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

  // Resolve the mandated agence's display name when a resale mandate exists.
  // (isWinningPromoter was computed above, before the visibility guard.)
  let resaleAgentName: string | null = null;
  if (listing.resaleAgentId) {
    resaleAgentName = await resolveAgenceName(listing.resaleAgentId);
  }

  res.json({
    listing: serializeListing(listing, counts.get(listing.id) ?? 0, reveal, isViewerOwner, {
      isWinningPromoter,
      resaleAgentName,
    }),
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
    const scores = computeOfferScores(offers);

    // Connection status per promoter (so the owner sees which promoter they've
    // already picked and whether admin has validated the introduction).
    const connections = await db
      .select()
      .from(demolitionConnectionsTable)
      .where(eq(demolitionConnectionsTable.listingId, listing.id));
    const connByPromoter = new Map(connections.map((c) => [c.promoterId, c.status]));

    // Return best score first so the comparative view is pre-ranked.
    const serialized = offers
      .map((o) =>
        serializeOffer(
          o,
          promoterMap.get(o.promoterId),
          scores.get(o.id),
          connByPromoter.get(o.promoterId) ?? null,
        ),
      )
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    res.json(serialized);
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
    if (role !== "developer") {
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

    if (listing.status !== "active") {
      res.status(409).json({ error: "Offers can only be submitted on active listings" });
      return;
    }

    const d = parsed.data;
    const [offer] = await db
      .insert(demolitionOffersTable)
      .values({
        listingId: listing.id,
        promoterId: req.user!.id,
        // Financial
        pricePerUnit: d.pricePerUnit,
        newUnitArea: d.newUnitArea,
        newUnitsOffer: d.newUnitsOffer,
        estimatedDeliveredValue: d.estimatedDeliveredValue,
        // Qualitative
        standing: d.standing,
        materials: d.materials ?? null,
        floors: d.floors,
        parkingPerUnit: d.parkingPerUnit,
        elevator: d.elevator ?? false,
        bikeStorage: d.bikeStorage ?? false,
        gym: d.gym ?? false,
        lobby: d.lobby ?? false,
        replacementHousing: d.replacementHousing ?? false,
        replacementHousingQuality: d.replacementHousingQuality ?? null,
        // Timeline & security
        constructionDurationMonths: d.constructionDurationMonths,
        startDelayMonths: d.startDelayMonths,
        bankGuarantee: d.bankGuarantee ?? false,
        projectReferences: d.projectReferences ?? null,
        message: d.message ?? null,
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
      newUnitArea: offer.newUnitArea,
      standing: offer.standing,
      constructionDurationMonths: offer.constructionDurationMonths,
      message: offer.message,
    });

    res.status(201).json(serializeOffer(offer, promoter));
  },
);

// POST /demolition/listings/:listingId/offers/:offerId/accept — the owner accepts
// an offer (open-bidding lock). Atomically: marks this offer 'accepted' and every
// other offer on the listing 'rejected', locks the listing ('offer_locked', no
// more offers), and opens the introduction (connection 'requested') for the
// winning promoter so an admin can validate it and reveal the exact address.
// Notifies every participating promoter (winner + losers).
router.post(
  "/demolition/listings/:listingId/offers/:offerId/accept",
  requireAuth,
  async (req, res): Promise<void> => {
    const listingId = Number(req.params.listingId);
    const offerId = Number(req.params.offerId);
    if (
      !Number.isInteger(listingId) ||
      listingId <= 0 ||
      !Number.isInteger(offerId) ||
      offerId <= 0
    ) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const [listing] = await db
      .select()
      .from(demolitionListingsTable)
      .where(eq(demolitionListingsTable.id, listingId))
      .limit(1);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    if (listing.ownerId !== req.user!.id) {
      res.status(403).json({ error: "Only the listing owner can accept an offer" });
      return;
    }
    // Open-bidding invariant: a listing can only be locked from the 'active' state.
    if (listing.status !== "active") {
      res.status(409).json({ error: "This listing is no longer open for acceptance" });
      return;
    }

    // All offers on the listing — needed to find the winner and notify the losers.
    const allOffers = await db
      .select()
      .from(demolitionOffersTable)
      .where(eq(demolitionOffersTable.listingId, listingId));
    const winning = allOffers.find((o) => o.id === offerId);
    if (!winning) {
      res.status(404).json({ error: "Offer not found for this listing" });
      return;
    }

    // Atomic lock + status transitions + open the winner's introduction.
    await db.transaction(async (tx) => {
      await tx
        .update(demolitionOffersTable)
        .set({ status: "accepted" })
        .where(eq(demolitionOffersTable.id, offerId));
      await tx
        .update(demolitionOffersTable)
        .set({ status: "rejected" })
        .where(
          and(
            eq(demolitionOffersTable.listingId, listingId),
            ne(demolitionOffersTable.id, offerId),
          ),
        );
      await tx
        .update(demolitionListingsTable)
        .set({ status: "offer_locked", acceptedOfferId: offerId })
        .where(eq(demolitionListingsTable.id, listingId));
      // Open the mise-en-relation for the winner (admin validates → address reveal).
      await tx
        .insert(demolitionConnectionsTable)
        .values({
          listingId,
          promoterId: winning.promoterId,
          offerId,
          status: "requested",
          commissionStatus: "none",
        })
        .onConflictDoUpdate({
          target: [
            demolitionConnectionsTable.listingId,
            demolitionConnectionsTable.promoterId,
          ],
          set: {
            offerId,
            status: "requested",
            commissionStatus: "none",
            validatedAt: null,
          },
        });
    });

    // Best-effort notifications (after commit — never block the response on email).
    const promoterIds = [...new Set(allOffers.map((o) => o.promoterId))];
    const promoters = promoterIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(or(...promoterIds.map((id) => eq(usersTable.id, id))))
      : [];
    const promoterMap = new Map(promoters.map((p) => [p.id, p]));

    const winnerUser = promoterMap.get(winning.promoterId);
    void sendOfferAcceptedEmail({
      promoterName: promoterDisplayName(winnerUser),
      promoterEmail: winnerUser?.email ?? null,
      buildingCity: listing.city,
      buildingNeighborhood: listing.neighborhood,
    });
    for (const id of promoterIds) {
      if (id === winning.promoterId) continue;
      const loser = promoterMap.get(id);
      if (!loser?.email) continue;
      void sendOfferRejectedEmail({
        promoterName: promoterDisplayName(loser),
        promoterEmail: loser.email,
        buildingCity: listing.city,
        buildingNeighborhood: listing.neighborhood,
      });
    }

    const [updated] = await db
      .select()
      .from(demolitionListingsTable)
      .where(eq(demolitionListingsTable.id, listingId))
      .limit(1);
    const counts = await countOffers([listingId]);
    res.json(serializeListing(updated ?? listing, counts.get(listingId) ?? 0, true, true));
  },
);

// GET /demolition/listings/:listingId/connections — owner or admin only
router.get(
  "/demolition/listings/:listingId/connections",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListDemolitionConnectionsParams.safeParse(req.params);
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

    const connections = await db
      .select()
      .from(demolitionConnectionsTable)
      .where(eq(demolitionConnectionsTable.listingId, listing.id))
      .orderBy(desc(demolitionConnectionsTable.createdAt));

    const promoterIds = [...new Set(connections.map((c) => c.promoterId))];
    const promoters = promoterIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(or(...promoterIds.map((id) => eq(usersTable.id, id))))
      : [];
    const promoterMap = new Map(promoters.map((p) => [p.id, p]));

    res.json(
      connections.map((c) =>
        serializeConnection(c, {
          promoter: promoterMap.get(c.promoterId),
          listing,
          // Owner/admin always know the address; expose it for context.
          includeAddress: true,
        }),
      ),
    );
  },
);

// POST /demolition/listings/:listingId/connections — owner selects a promoter
router.post(
  "/demolition/listings/:listingId/connections",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = CreateDemolitionConnectionParams.safeParse(req.params);
    const parsed = CreateDemolitionConnectionBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Invalid request" });
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

    // Only the listing owner may initiate an introduction.
    if (listing.ownerId !== req.user!.id) {
      res.status(403).json({ error: "Only the listing owner can choose a promoter" });
      return;
    }

    // Derive the promoter from the chosen offer (must belong to this listing).
    const [offer] = await db
      .select()
      .from(demolitionOffersTable)
      .where(
        and(
          eq(demolitionOffersTable.id, parsed.data.offerId),
          eq(demolitionOffersTable.listingId, listing.id),
        ),
      )
      .limit(1);

    if (!offer) {
      res.status(404).json({ error: "Offer not found for this listing" });
      return;
    }

    // Upsert: re-selecting the same promoter is idempotent (keeps existing status).
    const [conn] = await db
      .insert(demolitionConnectionsTable)
      .values({
        listingId: listing.id,
        promoterId: offer.promoterId,
        offerId: offer.id,
        status: "requested",
        commissionStatus: "none",
      })
      .onConflictDoUpdate({
        target: [
          demolitionConnectionsTable.listingId,
          demolitionConnectionsTable.promoterId,
        ],
        // Re-selecting resets the connection back to "requested" so a previously
        // rejected promoter can be re-proposed for admin validation.
        set: {
          offerId: offer.id,
          status: "requested",
          commissionStatus: "none",
          validatedAt: null,
        },
      })
      .returning();

    const [promoter] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, offer.promoterId))
      .limit(1);

    res.status(201).json(
      serializeConnection(conn, { promoter, listing, includeAddress: true }),
    );
  },
);

// GET /demolition/admin/connections — moderation queue (admin)
router.get(
  "/demolition/admin/connections",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const connections = await db
      .select()
      .from(demolitionConnectionsTable)
      .orderBy(desc(demolitionConnectionsTable.createdAt))
      .limit(500);

    const promoterIds = [...new Set(connections.map((c) => c.promoterId))];
    const listingIds = [...new Set(connections.map((c) => c.listingId))];
    const [promoters, listings] = await Promise.all([
      promoterIds.length
        ? db
            .select()
            .from(usersTable)
            .where(or(...promoterIds.map((id) => eq(usersTable.id, id))))
        : Promise.resolve([] as UserRow[]),
      listingIds.length
        ? db
            .select()
            .from(demolitionListingsTable)
            .where(or(...listingIds.map((id) => eq(demolitionListingsTable.id, id))))
        : Promise.resolve([] as ListingRow[]),
    ]);
    const promoterMap = new Map(promoters.map((p) => [p.id, p]));
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    res.json(
      connections.map((c) =>
        serializeConnection(c, {
          promoter: promoterMap.get(c.promoterId),
          listing: listingMap.get(c.listingId),
          includeAddress: true,
        }),
      ),
    );
  },
);

// PATCH /demolition/admin/connections/:connectionId — validate/reject (admin)
router.patch(
  "/demolition/admin/connections/:connectionId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateDemolitionConnectionStatusParams.safeParse(req.params);
    const parsed = UpdateDemolitionConnectionStatusBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    // Look up the target connection first so we know its listing — validation
    // must be exclusive per listing (only ONE promoter may ever be revealed).
    const [existing] = await db
      .select()
      .from(demolitionConnectionsTable)
      .where(eq(demolitionConnectionsTable.id, params.data.connectionId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }

    // CONFIDENTIALITY INVARIANT: at most one validated connection per listing.
    // If another promoter is already validated for this listing, refuse — the
    // admin must reject the current holder before revealing the address to
    // someone else, so the exact address is never disclosed to two promoters.
    if (parsed.data.status === "validated") {
      const [otherValidated] = await db
        .select({ id: demolitionConnectionsTable.id })
        .from(demolitionConnectionsTable)
        .where(
          and(
            eq(demolitionConnectionsTable.listingId, existing.listingId),
            eq(demolitionConnectionsTable.status, "validated"),
            ne(demolitionConnectionsTable.id, existing.id),
          ),
        )
        .limit(1);
      if (otherValidated) {
        res.status(409).json({
          error:
            "Another promoter is already validated for this listing. Reject it first.",
        });
        return;
      }
    }

    const updates: Partial<typeof demolitionConnectionsTable.$inferInsert> = {
      status: parsed.data.status,
    };
    // Validation reveals the address to the promoter and marks the commission due.
    if (parsed.data.status === "validated") {
      updates.validatedAt = new Date();
      updates.commissionStatus = "due";
    }

    const [conn] = await db
      .update(demolitionConnectionsTable)
      .set(updates)
      .where(eq(demolitionConnectionsTable.id, params.data.connectionId))
      .returning();

    if (!conn) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }

    // On validation, auto-reject every other still-pending connection for this
    // listing so the chosen promoter is unambiguous and no other promoter can
    // later be revealed without an explicit new admin action.
    if (conn.status === "validated") {
      await db
        .update(demolitionConnectionsTable)
        .set({ status: "rejected" })
        .where(
          and(
            eq(demolitionConnectionsTable.listingId, conn.listingId),
            eq(demolitionConnectionsTable.status, "requested"),
            ne(demolitionConnectionsTable.id, conn.id),
          ),
        );
    }

    const [[promoter], [listing]] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, conn.promoterId)).limit(1),
      db
        .select()
        .from(demolitionListingsTable)
        .where(eq(demolitionListingsTable.id, conn.listingId))
        .limit(1),
    ]);

    // Best-effort notification on validation — never block the response on email.
    if (conn.status === "validated" && listing) {
      void sendConnectionValidatedEmail({
        promoterName: promoterDisplayName(promoter),
        promoterEmail: promoter?.email ?? null,
        ownerName: listing.ownerName,
        ownerEmail: listing.ownerEmail,
        buildingAddress: listing.address,
        buildingCity: listing.city,
      });
    }

    res.json(
      serializeConnection(conn, { promoter, listing, includeAddress: true }),
    );
  },
);

// GET /demolition/agences — directory of registered agences a winning promoter
// can mandate for resale. Joins auth users (role='agent') with their B2B profile
// (matched by email) for company / ville / specialties, flagging the licence-
// verified ones. No contact details are exposed here (directory only).
router.get("/demolition/agences", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      fullName: usersTable.fullName,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      companyName: profilesTable.companyName,
      ville: profilesTable.ville,
      specialties: profilesTable.specialties,
      licenceStatut: profilesTable.licenceStatut,
    })
    .from(usersTable)
    .innerJoin(profilesTable, eq(profilesTable.email, usersTable.email))
    .where(eq(usersTable.role, "agent"))
    .orderBy(profilesTable.companyName);

  res.json(
    rows.map((r) => ({
      id: r.id,
      name:
        r.companyName ??
        r.fullName ??
        (r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.email),
      ville: r.ville,
      specialties: r.specialties ?? [],
      verified: r.licenceStatut === "verifie",
    })),
  );
});

// POST /demolition/listings/:listingId/resale — the winning promoter mandates a
// licensed agence to resell the acquired project. Only the promoter of the
// accepted offer may mandate, and only once the listing is 'offer_locked'.
router.post(
  "/demolition/listings/:listingId/resale",
  requireAuth,
  async (req, res): Promise<void> => {
    const listingId = Number(req.params.listingId);
    const agentId =
      typeof req.body?.agentId === "string" ? req.body.agentId.trim() : "";
    if (!Number.isInteger(listingId) || listingId <= 0 || !agentId) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const [listing] = await db
      .select()
      .from(demolitionListingsTable)
      .where(eq(demolitionListingsTable.id, listingId))
      .limit(1);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    if (listing.status !== "offer_locked" || !listing.acceptedOfferId) {
      res
        .status(409)
        .json({ error: "La revente n'est possible qu'une fois une offre acceptée." });
      return;
    }

    // Authorize: the caller must be the promoter of the accepted offer.
    const [accepted] = await db
      .select({ promoterId: demolitionOffersTable.promoterId })
      .from(demolitionOffersTable)
      .where(eq(demolitionOffersTable.id, listing.acceptedOfferId))
      .limit(1);
    if (!accepted || accepted.promoterId !== req.user!.id) {
      res
        .status(403)
        .json({ error: "Seul le promoteur retenu peut mandater une agence." });
      return;
    }

    // The mandated agence must be a registered agence (role='agent').
    const [agent] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, agentId), eq(usersTable.role, "agent")))
      .limit(1);
    if (!agent) {
      res.status(404).json({ error: "Agence introuvable." });
      return;
    }

    const [updated] = await db
      .update(demolitionListingsTable)
      .set({ resaleAgentId: agentId, resaleStatus: "mandated" })
      .where(eq(demolitionListingsTable.id, listingId))
      .returning();

    // Best-effort notification to the mandated agence (never block the response).
    const agenceName = await resolveAgenceName(agentId);
    const [promoter] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);
    void sendResaleMandateEmail({
      agentName: agenceName,
      agentEmail: agent.email,
      promoterName: promoterDisplayName(promoter),
      promoterCompany: promoter?.company ?? null,
      buildingCity: listing.city,
      buildingNeighborhood: listing.neighborhood,
    });

    const counts = await countOffers([listingId]);
    res.json(
      serializeListing(updated ?? listing, counts.get(listingId) ?? 0, true, false, {
        isWinningPromoter: true,
        resaleAgentName: agenceName,
      }),
    );
  },
);

// GET /demolition/resale/assigned — projects a mandated agence must resell.
// Each project is returned with its (revealed) address and the winning
// promoter's contact so the agence can coordinate the resale.
router.get(
  "/demolition/resale/assigned",
  requireAuth,
  async (req, res): Promise<void> => {
    const listings = await db
      .select()
      .from(demolitionListingsTable)
      .where(eq(demolitionListingsTable.resaleAgentId, req.user!.id))
      .orderBy(desc(demolitionListingsTable.updatedAt));

    if (listings.length === 0) {
      res.json([]);
      return;
    }

    // Resolve each project's winning promoter (promoter of the accepted offer).
    const offerIds = listings
      .map((l) => l.acceptedOfferId)
      .filter((id): id is number => typeof id === "number");
    const offers = offerIds.length
      ? await db
          .select()
          .from(demolitionOffersTable)
          .where(or(...offerIds.map((id) => eq(demolitionOffersTable.id, id))))
      : [];
    const offerById = new Map(offers.map((o) => [o.id, o]));
    const promoterIds = [...new Set(offers.map((o) => o.promoterId))];
    const promoters = promoterIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(or(...promoterIds.map((id) => eq(usersTable.id, id))))
      : [];
    const promoterMap = new Map(promoters.map((p) => [p.id, p]));

    res.json(
      listings.map((l) => {
        const offer = l.acceptedOfferId ? offerById.get(l.acceptedOfferId) : null;
        const promoter = offer ? promoterMap.get(offer.promoterId) : null;
        return {
          listing: serializeListing(l, 0, true, false),
          promoterName: promoterDisplayName(promoter),
          promoterEmail: promoter?.email ?? null,
          promoterCompany: promoter?.company ?? null,
        };
      }),
    );
  },
);

export default router;
