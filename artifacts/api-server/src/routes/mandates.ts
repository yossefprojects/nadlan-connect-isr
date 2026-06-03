import { Router } from "express";
import { db } from "@workspace/db";
import { mandatesTable, listingsTable, usersTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const MandateInputSchema = z.object({
  exclusive: z.boolean(),
  justificationUrl: z.string().optional(),
  note: z.string().optional(),
});

const MandateStatusUpdateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

function serializeMandate(
  mandate: typeof mandatesTable.$inferSelect,
  listing?: typeof listingsTable.$inferSelect | null,
  agent?: typeof usersTable.$inferSelect | null
) {
  return {
    id: mandate.id,
    listingId: mandate.listingId,
    listingTitle: listing?.title ?? null,
    agentId: mandate.agentId,
    agentName: agent
      ? agent.fullName ??
        (agent.firstName && agent.lastName
          ? `${agent.firstName} ${agent.lastName}`
          : agent.firstName ?? null)
      : null,
    agentEmail: agent?.email ?? null,
    exclusive: mandate.exclusive,
    status: mandate.status,
    justificationUrl: mandate.justificationUrl ?? null,
    note: mandate.note ?? null,
    createdAt: mandate.createdAt.toISOString(),
  };
}

// POST /listings/:listingId/mandates — agent applies
router.post("/listings/:listingId/mandates", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const listingId = parseInt(req.params.listingId, 10);
  if (isNaN(listingId)) {
    res.status(400).json({ error: "Invalid listing ID" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (user[0]?.role !== "agent") {
    res.status(403).json({ error: "Only agents can apply for mandates" });
    return;
  }

  const parsed = MandateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const listing = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);
  if (!listing[0]) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  // Check for duplicate application
  const existing = await db
    .select()
    .from(mandatesTable)
    .where(and(eq(mandatesTable.listingId, listingId), eq(mandatesTable.agentId, req.user!.id)))
    .limit(1);
  if (existing[0]) {
    res.status(409).json({ error: "You have already applied for this listing" });
    return;
  }

  const [mandate] = await db
    .insert(mandatesTable)
    .values({
      listingId,
      agentId: req.user!.id,
      exclusive: parsed.data.exclusive,
      justificationUrl: parsed.data.justificationUrl ?? null,
      note: parsed.data.note ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json(serializeMandate(mandate, listing[0], user[0]));
});

// GET /listings/:listingId/mandates — developer sees applications for their listing
router.get("/listings/:listingId/mandates", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const listingId = parseInt(req.params.listingId, 10);
  if (isNaN(listingId)) {
    res.status(400).json({ error: "Invalid listing ID" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const role = user[0]?.role;

  // Must be the owner or admin
  const listing = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);
  if (!listing[0]) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (role !== "admin" && listing[0].ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const mandates = await db
    .select()
    .from(mandatesTable)
    .where(eq(mandatesTable.listingId, listingId));

  const agentIds = [...new Set(mandates.map((m) => m.agentId))];
  const agents =
    agentIds.length > 0
      ? await db.select().from(usersTable).where(or(...agentIds.map((id) => eq(usersTable.id, id))))
      : [];
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  res.json(mandates.map((m) => serializeMandate(m, listing[0], agentMap.get(m.agentId))));
});

// GET /users/me/mandates — agent sees their own applications
router.get("/users/me/mandates", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const mandates = await db
    .select()
    .from(mandatesTable)
    .where(eq(mandatesTable.agentId, req.user!.id));

  const listingIds = [...new Set(mandates.map((m) => m.listingId))];
  const listings =
    listingIds.length > 0
      ? await db.select().from(listingsTable).where(or(...listingIds.map((id) => eq(listingsTable.id, id))))
      : [];
  const listingMap = new Map(listings.map((l) => [l.id, l]));

  res.json(mandates.map((m) => serializeMandate(m, listingMap.get(m.listingId) ?? null, null)));
});

// PATCH /mandates/:mandateId — developer approves or rejects
router.patch("/mandates/:mandateId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const mandateId = parseInt(req.params.mandateId, 10);
  if (isNaN(mandateId)) {
    res.status(400).json({ error: "Invalid mandate ID" });
    return;
  }

  const parsed = MandateStatusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const mandate = await db.select().from(mandatesTable).where(eq(mandatesTable.id, mandateId)).limit(1);
  if (!mandate[0]) {
    res.status(404).json({ error: "Mandate not found" });
    return;
  }

  const listing = await db.select().from(listingsTable).where(eq(listingsTable.id, mandate[0].listingId)).limit(1);
  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

  if (user[0]?.role !== "admin" && listing[0]?.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(mandatesTable)
    .set({ status: parsed.data.status })
    .where(eq(mandatesTable.id, mandateId))
    .returning();

  res.json(serializeMandate(updated, listing[0] ?? null, null));
});

// DELETE /mandates/:mandateId — agent withdraws their application
router.delete("/mandates/:mandateId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const mandateId = parseInt(req.params.mandateId, 10);
  if (isNaN(mandateId)) {
    res.status(400).json({ error: "Invalid mandate ID" });
    return;
  }

  const mandate = await db.select().from(mandatesTable).where(eq(mandatesTable.id, mandateId)).limit(1);
  if (!mandate[0]) {
    res.status(404).json({ error: "Mandate not found" });
    return;
  }
  if (mandate[0].agentId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(mandatesTable).where(eq(mandatesTable.id, mandateId));
  res.json({ success: true });
});

export default router;
