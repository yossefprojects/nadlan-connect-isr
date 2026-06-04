import { Router, type Request, type Response } from "express";
import { Readable } from "stream";
import { db } from "@workspace/db";
import {
  documentsTable,
  programsTable,
  listingsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  AddProgramDocumentParams,
  AddProgramDocumentBody,
  ListProgramDocumentsParams,
  AddListingDocumentParams,
  AddListingDocumentBody,
  ListListingDocumentsParams,
  DeleteDocumentParams,
} from "@workspace/api-zod";
import {
  serializeDocument,
  isAdmin,
  visibilityForCategory,
  type DocumentCategory,
} from "../lib/documents";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router = Router();
const objectStorageService = new ObjectStorageService();

// ── Programme documents ──

// GET /programs/:programId/documents
router.get(
  "/programs/:programId/documents",
  async (req: Request, res: Response): Promise<void> => {
    const params = ListProgramDocumentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid programme ID" });
      return;
    }

    const [program] = await db
      .select()
      .from(programsTable)
      .where(eq(programsTable.id, params.data.programId))
      .limit(1);
    if (!program) {
      res.status(404).json({ error: "Programme not found" });
      return;
    }

    const viewerId = req.isAuthenticated() ? req.user!.id : null;
    const canSeePrivate =
      viewerId === program.ownerId ||
      (viewerId !== null && (await isAdmin(viewerId)));

    // Draft programmes are visible only to their owner or an admin.
    if (program.status !== "published" && !canSeePrivate) {
      res.status(404).json({ error: "Programme not found" });
      return;
    }

    const docs = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.programId, program.id))
      .orderBy(documentsTable.createdAt);

    res.json(
      docs
        .filter((d) => d.visibility === "public" || canSeePrivate)
        .map(serializeDocument)
    );
  }
);

// POST /programs/:programId/documents
router.post(
  "/programs/:programId/documents",
  async (req: Request, res: Response): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const params = AddProgramDocumentParams.safeParse(req.params);
    const parsed = AddProgramDocumentBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const [program] = await db
      .select()
      .from(programsTable)
      .where(eq(programsTable.id, params.data.programId))
      .limit(1);
    if (!program) {
      res.status(404).json({ error: "Programme not found" });
      return;
    }
    if (program.ownerId !== req.user!.id && !(await isAdmin(req.user!.id))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const category = parsed.data.category as DocumentCategory;
    const normalized = objectStorageService.normalizeObjectEntityPath(
      parsed.data.objectPath
    );

    const [doc] = await db
      .insert(documentsTable)
      .values({
        ownerId: program.ownerId,
        programId: program.id,
        category,
        visibility: visibilityForCategory(category),
        objectPath: normalized,
        fileName: parsed.data.fileName ?? null,
        mimeType: parsed.data.mimeType ?? null,
      })
      .returning();

    res.status(201).json(serializeDocument(doc));
  }
);

// ── Projet (listing) documents ──

// GET /listings/:listingId/documents
router.get(
  "/listings/:listingId/documents",
  async (req: Request, res: Response): Promise<void> => {
    const params = ListListingDocumentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid projet ID" });
      return;
    }

    const [listing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.listingId))
      .limit(1);
    if (!listing) {
      res.status(404).json({ error: "Projet not found" });
      return;
    }

    const viewerId = req.isAuthenticated() ? req.user!.id : null;
    const canSeePrivate =
      viewerId === listing.ownerId ||
      (viewerId !== null && (await isAdmin(viewerId)));

    // Draft projets are visible only to their owner or an admin.
    if (listing.status !== "published" && !canSeePrivate) {
      res.status(404).json({ error: "Projet not found" });
      return;
    }

    const docs = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.listingId, listing.id))
      .orderBy(documentsTable.createdAt);

    res.json(
      docs
        .filter((d) => d.visibility === "public" || canSeePrivate)
        .map(serializeDocument)
    );
  }
);

// POST /listings/:listingId/documents
router.post(
  "/listings/:listingId/documents",
  async (req: Request, res: Response): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const params = AddListingDocumentParams.safeParse(req.params);
    const parsed = AddListingDocumentBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const [listing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.listingId))
      .limit(1);
    if (!listing) {
      res.status(404).json({ error: "Projet not found" });
      return;
    }
    if (listing.ownerId !== req.user!.id && !(await isAdmin(req.user!.id))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const category = parsed.data.category as DocumentCategory;
    const normalized = objectStorageService.normalizeObjectEntityPath(
      parsed.data.objectPath
    );

    const [doc] = await db
      .insert(documentsTable)
      .values({
        ownerId: listing.ownerId,
        listingId: listing.id,
        category,
        visibility: visibilityForCategory(category),
        objectPath: normalized,
        fileName: parsed.data.fileName ?? null,
        mimeType: parsed.data.mimeType ?? null,
      })
      .returning();

    res.status(201).json(serializeDocument(doc));
  }
);

// ── Delete ──

// DELETE /documents/:documentId
router.delete(
  "/documents/:documentId",
  async (req: Request, res: Response): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const params = DeleteDocumentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid document ID" });
      return;
    }

    const [doc] = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, params.data.documentId))
      .limit(1);
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    if (doc.ownerId !== req.user!.id && !(await isAdmin(req.user!.id))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db
      .delete(documentsTable)
      .where(eq(documentsTable.id, params.data.documentId));
    res.json({ success: true });
  }
);

// ── Download (access-controlled; intentionally NOT in OpenAPI spec) ──

// GET /documents/:documentId/download
router.get(
  "/documents/:documentId/download",
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.documentId);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid document ID" });
      return;
    }

    const [doc] = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, id))
      .limit(1);
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const viewerId = req.isAuthenticated() ? req.user!.id : null;
    const isOwnerOrAdmin =
      viewerId !== null &&
      (doc.ownerId === viewerId || (await isAdmin(viewerId)));

    if (doc.visibility === "private" && !isOwnerOrAdmin) {
      res
        .status(viewerId === null ? 401 : 403)
        .json({ error: viewerId === null ? "Not authenticated" : "Forbidden" });
      return;
    }

    // Public docs of a draft parent (programme/projet) are visible only to
    // their owner or an admin — mirror the listing/detail visibility policy.
    if (!isOwnerOrAdmin) {
      let parentPublished = true;
      if (doc.programId !== null) {
        const [program] = await db
          .select({ status: programsTable.status })
          .from(programsTable)
          .where(eq(programsTable.id, doc.programId))
          .limit(1);
        parentPublished = program?.status === "published";
      } else if (doc.listingId !== null) {
        const [listing] = await db
          .select({ status: listingsTable.status })
          .from(listingsTable)
          .where(eq(listingsTable.id, doc.listingId))
          .limit(1);
        parentPublished = listing?.status === "published";
      }
      if (!parentPublished) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
    }

    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        doc.objectPath
      );
      const response = await objectStorageService.downloadObject(objectFile);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Object not found" });
        return;
      }
      req.log.error({ err: error }, "Error serving document");
      res.status(500).json({ error: "Failed to serve document" });
    }
  }
);

export default router;
