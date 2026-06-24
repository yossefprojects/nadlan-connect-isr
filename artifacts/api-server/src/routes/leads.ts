import { Router } from "express";
import { db } from "@workspace/db";
import {
  leadsTable,
  messagesTable,
  listingsTable,
  usersTable,
  favoritesTable,
  listingImagesTable,
} from "@workspace/db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import {
  CreateLeadBody,
  GetLeadParams,
  UpdateLeadStatusParams,
  UpdateLeadStatusBody,
  GetLeadMessagesParams,
  SendMessageParams,
  SendMessageBody,
  AddFavoriteParams,
  RemoveFavoriteParams,
} from "@workspace/api-zod";

const router = Router();

// Authorization helper: a lead may only be accessed by its buyer, the owner of
// the target listing, or an admin. Returns the loaded lead + listing so callers
// can reuse them without an extra query.
async function loadLeadAuth(userId: string, leadId: number) {
  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, leadId))
    .limit(1);
  if (!lead) {
    return { lead: null as null } as const;
  }
  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, lead.listingId))
    .limit(1);
  const [u] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  const isAdmin = u?.role === "admin";
  const isBuyer = lead.buyerId === userId;
  const isOwner = !!listing && listing.ownerId === userId;
  return {
    lead,
    listing: listing ?? null,
    isAdmin,
    canView: isBuyer || isOwner || isAdmin, // participants + admin
    canManage: isOwner || isAdmin, // only the pro (listing owner) or admin
  } as const;
}

function serializeLead(
  lead: typeof leadsTable.$inferSelect,
  listing?: typeof listingsTable.$inferSelect | null,
  buyer?: typeof usersTable.$inferSelect | null
) {
  return {
    id: lead.id,
    listingId: lead.listingId,
    listingSlug: listing?.slug ?? null,
    listingTitle: listing?.title ?? null,
    buyerId: lead.buyerId,
    buyerName: buyer
      ? buyer.fullName ?? (buyer.firstName && buyer.lastName ? `${buyer.firstName} ${buyer.lastName}` : buyer.firstName ?? null)
      : null,
    buyerEmail: buyer?.email ?? null,
    message: lead.message,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
  };
}

function serializeMessage(
  msg: typeof messagesTable.$inferSelect,
  sender?: typeof usersTable.$inferSelect | null
) {
  return {
    id: msg.id,
    leadId: msg.leadId,
    senderId: msg.senderId,
    senderName: sender
      ? sender.fullName ?? (sender.firstName && sender.lastName ? `${sender.firstName} ${sender.lastName}` : sender.firstName ?? null)
      : null,
    senderAvatar: sender?.avatarUrl ?? sender?.profileImageUrl ?? null,
    body: msg.body,
    createdAt: msg.createdAt.toISOString(),
  };
}

// GET /leads
router.get("/leads", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const role = user[0]?.role;

  let leads: Array<typeof leadsTable.$inferSelect> = [];

  if (role === "admin") {
    leads = await db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt)).limit(100);
  } else if (role === "agent" || role === "developer") {
    // Get leads for their listings
    const myListings = await db
      .select({ id: listingsTable.id })
      .from(listingsTable)
      .where(eq(listingsTable.ownerId, req.user!.id));
    const listingIds = myListings.map((l) => l.id);
    if (listingIds.length > 0) {
      leads = await db
        .select()
        .from(leadsTable)
        .where(
          or(
            ...listingIds.map((id) => eq(leadsTable.listingId, id))
          )
        )
        .orderBy(desc(leadsTable.createdAt))
        .limit(100);
    }
  } else {
    // buyer
    leads = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.buyerId, req.user!.id))
      .orderBy(desc(leadsTable.createdAt))
      .limit(100);
  }

  // Fetch listings and buyers for enrichment
  const listingIds = [...new Set(leads.map((l) => l.listingId))];
  const buyerIds = [...new Set(leads.map((l) => l.buyerId))];

  const [listings, buyers] = await Promise.all([
    listingIds.length > 0
      ? db.select().from(listingsTable).where(or(...listingIds.map((id) => eq(listingsTable.id, id))))
      : [],
    buyerIds.length > 0
      ? db.select().from(usersTable).where(or(...buyerIds.map((id) => eq(usersTable.id, id))))
      : [],
  ]);

  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const buyerMap = new Map(buyers.map((b) => [b.id, b]));

  res.json(
    leads.map((lead) =>
      serializeLead(lead, listingMap.get(lead.listingId), buyerMap.get(lead.buyerId))
    )
  );
});

// POST /leads
router.post("/leads", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db
    .insert(leadsTable)
    .values({
      listingId: parsed.data.listingId,
      buyerId: req.user!.id,
      message: parsed.data.message,
      status: "new",
    })
    .returning();

  // Create the initial message
  await db.insert(messagesTable).values({
    leadId: lead.id,
    senderId: req.user!.id,
    body: parsed.data.message,
  });

  res.status(201).json(serializeLead(lead, null, null));
});

// GET /leads/:leadId
router.get("/leads/:leadId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lead ID" });
    return;
  }

  const auth = await loadLeadAuth(req.user!.id, params.data.leadId);
  if (!auth.lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  if (!auth.canView) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const lead = auth.lead;

  const [listing, buyer, messages] = await Promise.all([
    Promise.resolve(auth.listing),
    db.select().from(usersTable).where(eq(usersTable.id, lead.buyerId)).limit(1).then((r) => r[0] ?? null),
    db.select().from(messagesTable).where(eq(messagesTable.leadId, lead.id)).orderBy(messagesTable.createdAt),
  ]);

  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders = senderIds.length > 0
    ? await db.select().from(usersTable).where(or(...senderIds.map((id) => eq(usersTable.id, id))))
    : [];
  const senderMap = new Map(senders.map((s) => [s.id, s]));

  res.json({
    lead: serializeLead(lead, listing, buyer),
    messages: messages.map((m) => serializeMessage(m, senderMap.get(m.senderId))),
  });
});

// PATCH /leads/:leadId
router.patch("/leads/:leadId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = UpdateLeadStatusParams.safeParse(req.params);
  const parsed = UpdateLeadStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const auth = await loadLeadAuth(req.user!.id, params.data.leadId);
  if (!auth.lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  // Updating a lead's status is a "pro" action: only the listing owner or admin.
  if (!auth.canManage) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(leadsTable)
    .set({ status: parsed.data.status })
    .where(eq(leadsTable.id, params.data.leadId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(serializeLead(updated, null, null));
});

// GET /leads/:leadId/messages
router.get("/leads/:leadId/messages", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = GetLeadMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lead ID" });
    return;
  }

  const auth = await loadLeadAuth(req.user!.id, params.data.leadId);
  if (!auth.lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  if (!auth.canView) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.leadId, params.data.leadId))
    .orderBy(messagesTable.createdAt);

  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders = senderIds.length > 0
    ? await db.select().from(usersTable).where(or(...senderIds.map((id) => eq(usersTable.id, id))))
    : [];
  const senderMap = new Map(senders.map((s) => [s.id, s]));

  res.json(messages.map((m) => serializeMessage(m, senderMap.get(m.senderId))));
});

// POST /leads/:leadId/messages
router.post("/leads/:leadId/messages", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = SendMessageParams.safeParse(req.params);
  const parsed = SendMessageBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const auth = await loadLeadAuth(req.user!.id, params.data.leadId);
  if (!auth.lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  if (!auth.canView) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      leadId: params.data.leadId,
      senderId: req.user!.id,
      body: parsed.data.body,
    })
    .returning();

  res.status(201).json(serializeMessage(msg, null));
});

// GET /favorites
router.get("/favorites", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const favs = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, req.user!.id));

  const listingIds = favs.map((f) => f.listingId);
  if (listingIds.length === 0) {
    res.json([]);
    return;
  }

  const listings = await db
    .select()
    .from(listingsTable)
    .where(or(...listingIds.map((id) => eq(listingsTable.id, id))));

  const GALLERY_LIMIT = 6;
  const imageRows = await db
    .select({
      listingId: listingImagesTable.listingId,
      url: listingImagesTable.url,
      position: listingImagesTable.position,
    })
    .from(listingImagesTable)
    .where(
      sql`${listingImagesTable.listingId} = ANY(ARRAY[${sql.join(listingIds.map((id) => sql`${id}`), sql`, `)}]::integer[])`
    )
    .orderBy(listingImagesTable.listingId, listingImagesTable.position);
  const galleryMap = new Map<number, string[]>();
  for (const row of imageRows) {
    const existing = galleryMap.get(row.listingId);
    if (existing) {
      if (existing.length < GALLERY_LIMIT) existing.push(row.url);
    } else {
      galleryMap.set(row.listingId, [row.url]);
    }
  }

  res.json(
    listings.map((l) => {
      const gallery = galleryMap.get(l.id) ?? [];
      return {
        id: l.id,
        ownerId: l.ownerId,
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
        coverImageUrl: gallery[0] ?? null,
        galleryImageUrls: gallery,
        createdAt: l.createdAt.toISOString(),
      };
    })
  );
});

// POST /favorites/:listingId
router.post("/favorites/:listingId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = AddFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid listing ID" });
    return;
  }

  const [fav] = await db
    .insert(favoritesTable)
    .values({ userId: req.user!.id, listingId: params.data.listingId })
    .onConflictDoNothing()
    .returning();

  res.status(201).json({
    id: fav?.id ?? 0,
    userId: req.user!.id,
    listingId: params.data.listingId,
    createdAt: fav?.createdAt?.toISOString() ?? new Date().toISOString(),
  });
});

// DELETE /favorites/:listingId
router.delete("/favorites/:listingId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid listing ID" });
    return;
  }

  await db
    .delete(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, req.user!.id),
        eq(favoritesTable.listingId, params.data.listingId)
      )
    );

  res.json({ success: true });
});

export default router;
