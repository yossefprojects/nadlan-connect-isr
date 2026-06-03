import { Router } from "express";
import { db } from "@workspace/db";
import { listingsTable, leadsTable, usersTable } from "@workspace/db";
import { eq, count, and, or, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userId = req.user!.id;

  // Get pro's listings
  const myListings = await db
    .select({ id: listingsTable.id, status: listingsTable.status })
    .from(listingsTable)
    .where(eq(listingsTable.ownerId, userId));

  const myListingIds = myListings.map((l) => l.id);

  // Get leads for their listings
  let leadsData: Array<{ status: string }> = [];
  if (myListingIds.length > 0) {
    leadsData = await db
      .select({ status: leadsTable.status })
      .from(leadsTable)
      .where(or(...myListingIds.map((id) => eq(leadsTable.listingId, id))));
  }

  const totalListings = myListings.length;
  const publishedListings = myListings.filter((l) => l.status === "published").length;
  const draftListings = myListings.filter((l) => l.status === "draft").length;
  const totalLeads = leadsData.length;
  const newLeads = leadsData.filter((l) => l.status === "new").length;
  const contactedLeads = leadsData.filter((l) => l.status === "contacted").length;
  const closedLeads = leadsData.filter((l) => l.status === "closed").length;

  res.json({
    totalListings,
    publishedListings,
    draftListings,
    totalLeads,
    newLeads,
    contactedLeads,
    closedLeads,
  });
});

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const [
    totalUsersResult,
    totalListingsResult,
    totalLeadsResult,
    usersByRoleResult,
    listingsByStatusResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(listingsTable),
    db.select({ count: count() }).from(leadsTable),
    db
      .select({ role: usersTable.role, count: count() })
      .from(usersTable)
      .groupBy(usersTable.role),
    db
      .select({ status: listingsTable.status, count: count() })
      .from(listingsTable)
      .groupBy(listingsTable.status),
  ]);

  res.json({
    totalUsers: totalUsersResult[0]?.count ?? 0,
    totalListings: totalListingsResult[0]?.count ?? 0,
    totalLeads: totalLeadsResult[0]?.count ?? 0,
    usersByRole: usersByRoleResult.map((r) => ({ role: r.role ?? "unknown", count: r.count })),
    listingsByStatus: listingsByStatusResult.map((r) => ({ status: r.status, count: r.count })),
  });
});

export default router;
