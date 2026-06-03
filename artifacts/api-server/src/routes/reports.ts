import { Router } from "express";
import { db, savedReportsTable } from "@workspace/db";
import type { SavedReportRow } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CreateReportBody, DeleteReportParams, GetReportParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

function serializeReport(row: SavedReportRow) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    listingText: row.listingText ?? null,
    analysis: row.analysis ?? null,
    chatMarkdown: row.chatMarkdown ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /reports
router.get("/reports", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(savedReportsTable)
    .where(eq(savedReportsTable.userId, req.user!.id))
    .orderBy(desc(savedReportsTable.createdAt));
  res.json(rows.map(serializeReport));
});

// POST /reports
router.post("/reports", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { kind, title, listingText, analysis, chatMarkdown } = parsed.data;
  const [row] = await db
    .insert(savedReportsTable)
    .values({
      userId: req.user!.id,
      kind,
      title,
      listingText: listingText ?? null,
      analysis: analysis ?? null,
      chatMarkdown: chatMarkdown ?? null,
    })
    .returning();

  res.status(201).json(serializeReport(row));
});

// GET /reports/:reportId
router.get("/reports/:reportId", requireAuth, async (req, res): Promise<void> => {
  const parsed = GetReportParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(savedReportsTable)
    .where(
      and(
        eq(savedReportsTable.id, parsed.data.reportId),
        eq(savedReportsTable.userId, req.user!.id),
      ),
    )
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Rapport introuvable." });
    return;
  }

  res.json(serializeReport(row));
});

// DELETE /reports/:reportId
router.delete("/reports/:reportId", requireAuth, async (req, res): Promise<void> => {
  const parsed = DeleteReportParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const deleted = await db
    .delete(savedReportsTable)
    .where(
      and(
        eq(savedReportsTable.id, parsed.data.reportId),
        eq(savedReportsTable.userId, req.user!.id),
      ),
    )
    .returning({ id: savedReportsTable.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "Rapport introuvable." });
    return;
  }

  res.json({ success: true });
});

export default router;
